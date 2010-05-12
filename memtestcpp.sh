#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/render.xml config/runtime.xml config/resource.xml config/common.xml config/input.xml config/pick.xml config/vaces_cpp.xml config/targets2.xml config/spectator.xml $*
