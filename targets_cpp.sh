#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/runtime.xml config/common.xml config/net.xml config/targets_cpp.xml config/framerate.xml config/exit.xml $*
