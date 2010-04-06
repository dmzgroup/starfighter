var dmz = {}
,   fuelBars
,   cannonBars
,   shieldBars
,   WeaponAttr
,   MissileAttr
;

dmz.object= require("dmz/components/object");
dmz.input = require("dmz/components/input");
dmz.overlay = require("dmz/components/overlay");
dmz.time = require("dmz/runtime/time");
dmz.vector = require("dmz/types/vector");
dmz.matrix = require("dmz/types/matrix");
dmz.mask = require("dmz/types/mask");
dmz.defs = require("dmz/runtime/definitions");
dmz.util = require("dmz/types/util");
dmz.bars = require("bars");

self.speed = dmz.overlay.lookup("hud-speed");
self.missiles = dmz.overlay.lookup("missile-count");
fuelBars = dmz.bars.create("fuel-bars");
cannonBars = dmz.bars.create("cannon-bars");
shieldBars = dmz.bars.create("shield-bars");
WeaponAttr = dmz.defs.createNamedHandle("Weapon_1");
MissileAttr = dmz.defs.createNamedHandle("Weapon_2");

dmz.time.setRepeatingTimer (self, function (time) {

   var hil = dmz.object.hil()
   ,   maxMun = 0
   ,   currentMun = 0
   ,   vel
   ,   mcount = 0
   ;

   if (hil) {

      maxMun = dmz.object.counter.max(hil, WeaponAttr);
      if (!maxMun || dmz.util.isZero(maxMun)) { maxMun = 1; }
      currentMun = dmz.object.counter(hil, WeaponAttr);
      if (!currentMun) { currentMun = 0; }

      fuelBars.update(Math.floor(10));
      cannonBars.update(Math.floor(10 * (currentMun / maxMun)));
      shieldBars.update(Math.floor(1));

      if (self.speed) {

         vel = dmz.object.velocity(hil);

         if (vel) {

            self.speed.text(Math.floor(vel.magnitude() * 3.6).toString());
         }
      }

      if (self.missiles) {

         mcount = dmz.object.counter(hil, MissileAttr);

         if (dmz.util.isDefined(mcount)) { self.missiles.text(mcount.toString()); }
      }
   }
});

