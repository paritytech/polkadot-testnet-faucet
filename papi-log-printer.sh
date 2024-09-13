#!/bin/sh

echo "Exited with non-zero code; latest 100 lines of papi-debug-inner.log:"
tail -n 100 papi-debug-inner.log

echo "latest 100 lines of papi-debug-outer.log:"
tail -n 100 papi-debug-outer.log
