@echo off
rem ============================================================
rem  换一圈 · 本地语义检索侧车（Windows 双击即可）
rem  首次运行会在 semantic\.venv 建虚拟环境并装依赖，之后直接启动。
rem  关掉窗口即停止；数据库连接取自 src\main\resources\db.properties。
rem ============================================================
setlocal
cd /d "%~dp0"

set "PY=%~dp0.venv\Scripts\python.exe"

if not exist "%PY%" (
    echo   首次运行：创建虚拟环境并安装依赖，大约需要一两分钟 ...
    python -m venv "%~dp0.venv"
    if errorlevel 1 (
        echo   [ERROR] 创建虚拟环境失败，请先安装 Python 3.10 以上版本。
        pause
        exit /b 1
    )
    "%PY%" -m pip install --disable-pip-version-check -q onnxruntime tokenizers pymysql numpy
    if errorlevel 1 (
        echo   [ERROR] 安装依赖失败，检查网络或 pip 源。
        pause
        exit /b 1
    )
)

echo.
echo   启动语义检索侧车，自检地址 http://127.0.0.1:18084/health
echo   健康检查里 "ready": true 之后搜索才会走语义检索。
echo.
"%PY%" "%~dp0run_local.py"

echo.
echo   侧车已停止。
pause
