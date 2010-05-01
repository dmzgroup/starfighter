var dmz =
     { object: require("dmz/components/object")
     , input: require("dmz/components/input")
     , event: require("dmz/components/event")
     , eventType: require("dmz/runtime/eventType")
     , overlay: require("dmz/components/overlay")
     , time: require("dmz/runtime/time")
     , vector: require("dmz/types/vector")
     , matrix: require("dmz/types/matrix")
     , mask: require("dmz/types/mask")
     , defs: require("dmz/runtime/definitions")
     , util: require("dmz/types/util")
     , bars: require("bars")
     }
  , killsCount = 0
  , killsText = dmz.overlay.lookup("kills")
  , fuelBars = dmz.bars.create("fuel-bars")
  , cannonBars = dmz.bars.create("cannon-bars")
  , shieldBars = dmz.bars.create("shield-bars")
  , WeaponAttr = dmz.defs.createNamedHandle("Weapon_1")
  , MissileAttr = dmz.defs.createNamedHandle("Weapon_2")
  , ShieldAttr = dmz.defs.createNamedHandle("Shield")
  , KillAttribute = dmz.defs.createNamedHandle("Event_Kill_Attribute")
  , Detonation = dmz.eventType.lookup("Event_Detonation")
  ;

self.speed = dmz.overlay.lookup("hud-speed");
self.missiles = dmz.overlay.lookup("missile-count");

dmz.time.setRepeatingTimer (self, function (time) {

   var hil = dmz.object.hil()
     , maxMun = 0
     , currentMun = 0
     , maxShield = 0
     , currentShield = 0
     , vel
     , mcount = 0
     ;

   if (hil) {

      maxMun = dmz.object.counter.max(hil, WeaponAttr);
      if (!maxMun || dmz.util.isZero(maxMun)) { maxMun = 1; }
      currentMun = dmz.object.counter(hil, WeaponAttr);
      if (!currentMun) { currentMun = 0; }

      maxShield = dmz.object.counter.max(hil, ShieldAttr);
      if (!maxShield || dmz.util.isZero(maxShield)) { maxShield = 1; }
      currentShield = dmz.object.counter(hil, ShieldAttr);
      if (!currentShield) { currentShield = 0; }

      fuelBars.update(Math.floor(10));
      cannonBars.update(Math.floor(10 * (currentMun / maxMun)));
      shieldBars.update(Math.floor(10 * (currentShield / maxShield)));

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


dmz.event.close.observe(self, Detonation, function (Event) {

   if (killsText && (dmz.object.hil() == dmz.event.objectHandle(Event, KillAttribute))) {

      killsCount++;
      killsText.text(killsCount.toString());
   }
});
