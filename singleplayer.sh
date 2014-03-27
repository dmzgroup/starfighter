#!/bin/sh

. ../scripts/envsetup.sh

export DMZ_APP_NAME=starfighter

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/render.xml config/runtime.xml config/resource.xml config/common.xml config/audio.xml config/input.xml config/controller.xml config/starfighter.xml config/targets.xml config/raider.xml config/battlestar.xml config/vaces.xml config/viper_overlay.xml config/viper_dradis.xml config/viper_hud.xml config/js.xml $*
