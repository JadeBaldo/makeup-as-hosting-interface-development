@echo off
setlocal
cd /d "%~dp0"
set "BLENDER_EXE=%~1"
if not defined BLENDER_EXE set "BLENDER_EXE=C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
if not exist "%BLENDER_EXE%" (
 echo Blender not found. Pass the full path to blender.exe as the first argument.
 pause
 exit /b 1
)
"%BLENDER_EXE%" --background --python "%~dp0build-study.py" -- --samples 48 --size 900
if errorlevel 1 exit /b 1
echo Output is in %~dp0output
pause
