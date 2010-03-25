#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/runtime.xml config/resource.xml config/common.xml config/audio.xml config/input.xml config/net.xml config/render.xml config/spectator.xml config/js.xml config/pick.xml $*
