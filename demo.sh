#!/bin/sh

#export DMZ_BIN_MODE=opt

. ../scripts/envsetup.sh

echo $BIN_HOME

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/render.xml config/runtime.xml config/resource.xml config/common.xml config/audio.xml config/input.xml config/controller.xml config/targets.xml config/raider.xml config/vaces.xml config/battlestar.xml config/starfighter.xml config/net.xml config/viper_overlay.xml config/viper_dradis.xml config/viper_hud.xml config/js.xml config/projector.xml $*
