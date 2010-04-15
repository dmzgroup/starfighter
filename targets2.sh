#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/runtime.xml config/common.xml config/net.xml config/targets2.xml config/framerate.xml config/exit.xml $*
