@echo off
cd /d %~dp0
start http://localhost:8080
python3 serve-local.py 8080
