#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/runtime.xml config/common.xml config/net.xml config/js.xml config/targets.xml config/exit.xml $*
