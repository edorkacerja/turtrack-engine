#!/bin/sh
XVFB_WHD=${XVFB_WHD:-1280x720x16}

for D in `seq 1 100`; do
  if [ ! -e "/tmp/.X${D}-lock" ]; then
    DISPLAY_NUM=$D
    break
  fi
done

echo "Starting Xvfb"
Xvfb :$DISPLAY_NUM -ac -screen 0 $XVFB_WHD -nolisten tcp &
sleep 2

echo "Executing command $@"
export DISPLAY=:$DISPLAY_NUM

exec "$@"
