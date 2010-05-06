#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/render.xml config/runtime.xml config/resource.xml config/common.xml config/audio.xml config/input.xml config/net.xml config/js.xml config/pick.xml config/spectator.xml config/spectator_overlay.xml $*
