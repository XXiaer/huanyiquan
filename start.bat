@echo off
rem ===================================================================
rem  HuanYiQuan - one click start (backend + frontend + database)
rem  Double click this file. Close the window to stop the server.
rem ===================================================================
setlocal
cd /d "%~dp0"

rem --- JVM memory limits live in .mvn\jvm.config, so plain "mvn exec:java"
rem     gets them too. Do not set MAVEN_OPTS here, or the two would fight.
rem     Current caps: heap 192MB, metaspace 128MB, code cache 48MB.

echo.
echo   HuanYiQuan  /  campus swap platform
echo   ------------------------------------------------------------
echo   front end  : http://localhost:8080
echo   design doc : http://localhost:8080/design.html
echo   admin      : admin / admin123
echo   demo users : 2021210001 / 2021210002 / 2021210003   password 123456
echo   ------------------------------------------------------------
echo   heap cap   : 192 MB  (see .mvn\jvm.config)
echo.

rem --- locate maven: use PATH first, fall back to the local wrapper ---
set "MVN="
where mvn >nul 2>nul && set "MVN=mvn"
if not defined MVN (
    set "MVN=C:\Users\ZhuanZ\.m2\wrapper\dists\apache-maven-3.10.0-bin\39q0qgmngdu329psje7bjgne79\apache-maven-3.10.0\bin\mvn.cmd"
)
if not exist "%MVN%" if /i not "%MVN%"=="mvn" (
    echo   [ERROR] Maven not found.
    echo   Install Maven, or edit the MVN path inside this file.
    echo.
    pause
    exit /b 1
)

rem --- check mysql port before starting, give a clear message ---
netstat -an | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo   [WARN] MySQL does not seem to be listening on 3306.
    echo          Start the MySQL service first, otherwise login will fail.
    echo.
)

echo   compiling ...
call "%MVN%" -o -q compile
if errorlevel 1 (
    echo   [ERROR] compile failed, see messages above.
    pause
    exit /b 1
)

echo   starting server, keep this window open ...
echo.
call "%MVN%" -o exec:java

echo.
echo   server stopped.
pause
