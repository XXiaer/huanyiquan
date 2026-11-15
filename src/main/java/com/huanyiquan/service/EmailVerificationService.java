package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.common.PasswordUtil;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.entity.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.SQLIntegrityConstraintViolationException;
import java.util.*;
import java.util.concurrent.TimeUnit;

public final class EmailVerificationService {
    private static final SecureRandom RANDOM=new SecureRandom();
    private EmailVerificationService(){}
    public static Map<String,Object> status(long id){
        String email=DBUtil.queryOne("SELECT email FROM account_email WHERE user_id=?",r->r.getString(1),id);
        return Map.of("email",email==null?"":email,"available",available());
    }
    private static boolean available(){
        for(String key: List.of("SMTP_HOST","SMTP_FROM","SMTP_USER","SMTP_PASSWORD")){
            String value=System.getenv(key);
            if(value==null||value.isBlank())return false;
        }
        return true;
    }
    private static String hex(byte[] bytes){StringBuilder b=new StringBuilder();for(byte v:bytes)b.append(String.format("%02x",v&255));return b.toString();}
    private static String digest(String salt,String code){
        try{return hex(MessageDigest.getInstance("SHA-256").digest((salt+code).getBytes(StandardCharsets.UTF_8)));}
        catch(Exception e){throw new IllegalStateException(e);}
    }
    public static void send(long id,String raw){
        if(!available())throw BizException.badRequest("邮件服务尚未配置");
        String email=normalizeEmail(raw);
        String code=String.format(Locale.ROOT,"%06d",RANDOM.nextInt(1000000));byte[] bytes=new byte[16];RANDOM.nextBytes(bytes);String salt=hex(bytes);
        DBUtil.tx(c->{
            DBUtil.queryOne(c,"SELECT id FROM `user` WHERE id=? FOR UPDATE",r->r.getLong(1),id);
            Integer recent=DBUtil.queryOne(c,"SELECT 1 FROM account_email_challenge WHERE user_id=? AND sent_at>NOW()-INTERVAL 60 SECOND",r->r.getInt(1),id);
            if(recent!=null)throw BizException.badRequest("请等待 60 秒后再发送");
            Long owner=DBUtil.queryOne(c,"SELECT user_id FROM account_email WHERE email=?",r->r.getLong(1),email);
            if(owner!=null&&owner!=id)throw BizException.badRequest("该邮箱无法绑定");
            DBUtil.update(c,"INSERT INTO account_email_challenge(user_id,email,salt,digest,sent_at) VALUES(?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE email=VALUES(email),salt=VALUES(salt),digest=VALUES(digest),sent_at=NOW(),attempts=0",id,email,salt,digest(salt,code));
            return null;
        });
        try { deliver(email,code); }
        catch (RuntimeException e) {
            DBUtil.update("DELETE FROM account_email_challenge WHERE user_id=? AND salt=?",id,salt);
            throw e;
        }
    }

    private static String normalizeEmail(String raw){
        String email=raw==null?"":raw.trim().toLowerCase(Locale.ROOT);
        if(email.length()>254||!email.matches("[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9-]+(?:\\.[a-z0-9-]+)+"))throw BizException.badRequest("请输入有效邮箱");
        return email;
    }

    private static void deliver(String email,String code){
        Process proc=null;
        try {
            proc=new ProcessBuilder(System.getenv().getOrDefault("SMTP_PYTHON","python3"),"scripts/send_verification_email.py")
                .redirectError(ProcessBuilder.Redirect.DISCARD).redirectOutput(ProcessBuilder.Redirect.DISCARD).start();
            try(var input=proc.getOutputStream()){input.write(("[\""+email+"\",\""+code+"\"]").getBytes(StandardCharsets.UTF_8));}
            if(!proc.waitFor(18,TimeUnit.SECONDS)||proc.exitValue()!=0)throw new IllegalStateException();
        }catch(Exception e){
            if(proc!=null)proc.destroyForcibly();
            if(e instanceof InterruptedException)Thread.currentThread().interrupt();
            throw BizException.badRequest("邮件发送失败，请稍后重试");
        }
    }

    public static void sendRegistration(String rawStudentNo,String rawEmail){
        if(!available())throw BizException.badRequest("邮件服务尚未配置");
        String studentNo=rawStudentNo==null?"":rawStudentNo.trim();
        if(!studentNo.matches("[0-9]{10}"))throw BizException.badRequest("请输入 10 位学号");
        String email=normalizeEmail(rawEmail);
        if(UserDao.existsStudentNo(studentNo))throw BizException.badRequest("这个学号已经注册过了");
        if(DBUtil.count("SELECT COUNT(*) FROM account_email WHERE email=?",email)>0)
            throw BizException.badRequest("该邮箱无法注册");
        String code=String.format(Locale.ROOT,"%06d",RANDOM.nextInt(1000000));
        byte[] bytes=new byte[16];RANDOM.nextBytes(bytes);
        String salt=hex(bytes);
        DBUtil.tx(c->{
            DBUtil.update(c,"INSERT IGNORE INTO registration_email_challenge(student_no,email,salt,digest,sent_at) "
                    +"VALUES(?,?,?,?,NOW()-INTERVAL 1 DAY)",studentNo,email,salt,digest(salt,code));
            Integer recent=DBUtil.queryOne(c,"SELECT sent_at>NOW()-INTERVAL 60 SECOND FROM registration_email_challenge WHERE student_no=? FOR UPDATE",
                    rs->rs.getInt(1),studentNo);
            if(recent!=null&&recent==1)throw BizException.badRequest("请等待 60 秒后再发送");
            Long sameEmail=DBUtil.queryOne(c,"SELECT COUNT(*) FROM registration_email_challenge WHERE email=? AND sent_at>NOW()-INTERVAL 60 SECOND",
                    rs->rs.getLong(1),email);
            if(sameEmail!=null&&sameEmail>0)throw BizException.badRequest("请等待 60 秒后再发送");
            DBUtil.update(c,"UPDATE registration_email_challenge SET email=?,salt=?,digest=?,sent_at=NOW(),attempts=0 WHERE student_no=?",
                    email,salt,digest(salt,code),studentNo);
            return null;
        });
        try { deliver(email,code); }
        catch(RuntimeException e){
            DBUtil.update("DELETE FROM registration_email_challenge WHERE student_no=? AND salt=?",studentNo,salt);
            throw e;
        }
    }

    public static User register(String studentNo, String nickname, String password,
                                String college, String building, String email, String code) {
        String no = Str.trim(studentNo);
        String nick = Str.trim(nickname);
        if (Str.isBlank(no) || !no.matches("^\\d{10}$")) {
            throw new BizException(400, "学号是 10 位数字，例如 2021210001");
        }
        if (Str.isBlank(nick) || nick.length() > 20) {
            throw new BizException(400, "昵称不能为空，且不超过 20 个字");
        }
        if (password == null || password.length() < 6 || password.length() > 20) {
            throw new BizException(400, "密码长度要在 6-20 位之间");
        }
        SensitiveWordDao.check(nick, "昵称");
        if (UserDao.existsStudentNo(no)) {
            throw new BizException(400, "这个学号已经注册过了，直接登录吧");
        }
        User u = new User();
        u.studentNo = no;
        u.nickname = nick;
        u.salt = PasswordUtil.newSalt();
        u.password = PasswordUtil.hash(password, u.salt);
        u.college = Str.trim(college);
        u.building = Str.trim(building);
        u.credit = Const.CREDIT_INIT;
        u.status = 1;
        u.role = 0;
        long id = registerVerified(u, email, code);
        return UserDao.findById(id);
    }

    public static User loginByPassword(String rawEmail,String password){
        String email=normalizeEmail(rawEmail);
        Long id=DBUtil.queryOne("SELECT user_id FROM account_email WHERE email=?",rs->rs.getLong(1),email);
        User user=id==null?null:UserDao.findById(id);
        if(user==null || password==null || password.isBlank())throw BizException.badRequest("邮箱或密码不正确");
        return UserService.login(user.studentNo,password);
    }

    public static void sendLogin(String rawEmail){
        if(!available())throw BizException.badRequest("邮件服务尚未配置");
        String email=normalizeEmail(rawEmail);
        Long id=DBUtil.queryOne("SELECT e.user_id FROM account_email e JOIN user u ON u.id=e.user_id WHERE e.email=? AND u.status=1",rs->rs.getLong(1),email);
        if(id==null)return;
        String code=String.format(Locale.ROOT,"%06d",RANDOM.nextInt(1000000));
        byte[] bytes=new byte[16];RANDOM.nextBytes(bytes);
        String salt=hex(bytes);
        boolean created=DBUtil.tx(c->{
            DBUtil.queryOne(c,"SELECT id FROM user WHERE id=? FOR UPDATE",rs->rs.getLong(1),id);
            Integer recent=DBUtil.queryOne(c,"SELECT 1 FROM login_email_challenge WHERE user_id=? AND sent_at>NOW()-INTERVAL 60 SECOND",rs->rs.getInt(1),id);
            if(recent!=null)return false;
            DBUtil.update(c,"INSERT INTO login_email_challenge(user_id,email,salt,digest,sent_at) VALUES(?,?,?,?,NOW()) "
                    +"ON DUPLICATE KEY UPDATE email=VALUES(email),salt=VALUES(salt),digest=VALUES(digest),sent_at=NOW(),attempts=0",
                    id,email,salt,digest(salt,code));
            return true;
        });
        if(!created)return;
        try{deliver(email,code);}
        catch(RuntimeException e){
            DBUtil.update("DELETE FROM login_email_challenge WHERE user_id=? AND salt=?",id,salt);
            throw e;
        }
    }

    public static User loginByCode(String rawEmail,String code){
        String email=normalizeEmail(rawEmail);
        if(code==null||!code.matches("[0-9]{6}"))throw BizException.badRequest("请输入 6 位验证码");
        Long id=DBUtil.tx(c->{
            Long userId=DBUtil.queryOne(c,"SELECT e.user_id FROM account_email e JOIN user u ON u.id=e.user_id WHERE e.email=? AND u.status=1 FOR UPDATE",rs->rs.getLong(1),email);
            if(userId==null)return null;
            String[] row=DBUtil.queryOne(c,"SELECT salt,digest FROM login_email_challenge WHERE user_id=? AND email=? AND attempts<5 AND sent_at>NOW()-INTERVAL 10 MINUTE FOR UPDATE",
                    rs->new String[]{rs.getString(1),rs.getString(2)},userId,email);
            if(row==null)return null;
            if(!MessageDigest.isEqual(digest(row[0],code).getBytes(StandardCharsets.US_ASCII),row[1].getBytes(StandardCharsets.US_ASCII))){
                DBUtil.update(c,"UPDATE login_email_challenge SET attempts=attempts+1 WHERE user_id=?",userId);
                return null;
            }
            DBUtil.update(c,"DELETE FROM login_email_challenge WHERE user_id=?",userId);
            return userId;
        });
        if(id==null)throw BizException.badRequest("验证码无效或已过期");
        return UserService.profile(id);
    }

    static long registerVerified(User user,String rawEmail,String code){
        if(code==null||!code.matches("[0-9]{6}"))throw BizException.badRequest("注册前请输入邮箱验证码");
        String email=normalizeEmail(rawEmail);
        Long id=DBUtil.tx(c->{
            String[] row=DBUtil.queryOne(c,"SELECT email,salt,digest FROM registration_email_challenge "
                    +"WHERE student_no=? AND attempts<5 AND sent_at>NOW()-INTERVAL 10 MINUTE FOR UPDATE",
                    rs->new String[]{rs.getString(1),rs.getString(2),rs.getString(3)},user.studentNo);
            if(row==null)return null;
            if(!email.equals(row[0]) || !MessageDigest.isEqual(digest(row[1],code).getBytes(StandardCharsets.US_ASCII),
                    row[2].getBytes(StandardCharsets.US_ASCII))){
                DBUtil.update(c,"UPDATE registration_email_challenge SET attempts=attempts+1 WHERE student_no=?",user.studentNo);
                return null;
            }
            long userId=UserDao.insert(c,user);
            if(DBUtil.update(c,"INSERT IGNORE INTO account_email(user_id,email) VALUES(?,?)",userId,email)!=1)
                throw BizException.badRequest("该邮箱无法注册");
            DBUtil.update(c,"DELETE FROM registration_email_challenge WHERE student_no=?",user.studentNo);
            return userId;
        });
        if(id==null)throw BizException.badRequest("验证码错误、已过期或尝试次数过多");
        return id;
    }
    public static void verify(long id,String code){
        if(code==null||!code.matches("[0-9]{6}"))throw BizException.badRequest("请输入 6 位验证码");
        boolean ok=DBUtil.tx(c->{
            String[] row=DBUtil.queryOne(c,"SELECT email,salt,digest FROM account_email_challenge WHERE user_id=? AND attempts<5 AND sent_at>NOW()-INTERVAL 10 MINUTE FOR UPDATE",r->new String[]{r.getString(1),r.getString(2),r.getString(3)},id);
            if(row==null)return false;
            if(!MessageDigest.isEqual(digest(row[1],code).getBytes(StandardCharsets.US_ASCII),row[2].getBytes(StandardCharsets.US_ASCII))){
                DBUtil.update(c,"UPDATE account_email_challenge SET attempts=attempts+1 WHERE user_id=?",id);return false;
            }
            Long owner=DBUtil.queryOne(c,"SELECT user_id FROM account_email WHERE email=?",r->r.getLong(1),row[0]);
            if(owner!=null&&owner!=id)return false;
            DBUtil.update(c,"DELETE FROM account_email WHERE user_id=?",id);
            if(DBUtil.update(c,"INSERT IGNORE INTO account_email(user_id,email) VALUES(?,?)",id,row[0])!=1)throw BizException.badRequest("该邮箱无法绑定");
            DBUtil.update(c,"DELETE FROM account_email_challenge WHERE user_id=?",id);
            return true;
        });
        if(!ok)throw BizException.badRequest("验证码错误、已过期或尝试次数过多");
    }
}
