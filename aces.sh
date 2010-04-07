#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/resource.xml config/render.xml config/runtime.xml config/common.xml config/net.xml config/js.xml config/aces.xml config/raider.xml config/exit.xml $*
