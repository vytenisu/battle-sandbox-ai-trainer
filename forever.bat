
@echo off
set sd_sscmd_continue = on
:i
set /p ITERATIONS=<models\main\iterations.log
echo Previous iterations: %ITERATIONS%
call npm run exec
set /A ITERATIONS=ITERATIONS+1
echo Iteration completed: %ITERATIONS%
echo %ITERATIONS% 1>models\main\iterations.log
goto i
