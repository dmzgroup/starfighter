var dmz = {}
,   active = 0
,   controls = { thrust: 0, roll: 0, pitch: 0 }
,   XPitch
,   YYaw
,   ZRoll
;

dmz.object = require("dmz/components/object");
dmz.event = require("dmz/components/event");
dmz.input = require("dmz/components/input");
dmz.isect = require("dmz/components/isect");
dmz.time = require("dmz/runtime/time");
dmz.vector = require("dmz/types/vector");
dmz.matrix = require("dmz/types/matrix");

XPitch = dmz.vector.create(1, 0, 0);
YYaw = dmz.vector.create(0, 1, 0);
ZRoll = dmz.vector.create(0, 0, -1);

self.log.error(JSON.stringify(controls));

dmz.time.setRepeatingTimer(self, function (Delta) {

   var hil = dmz.object.hil()
   ,   speed = 0
   ,   dir = dmz.vector.create(0, 0, -1)
   ,   pos
   ,   vel
   ,   ori
   ,   pMat
   ,   rMat
   ;

   if (hil && (active > 0)) {

      pos = dmz.object.position (hil);
      ori = dmz.object.orientation (hil);
      vel = dmz.object.velocity (hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }


      pMat = dmz.matrix.create().fromAxisAndAngle(XPitch, controls.pitch * Delta * Math.PI);
      rMat = dmz.matrix.create().fromAxisAndAngle(ZRoll, controls.roll * Delta * Math.PI);

      ori = ori.multiply(pMat.multiply(rMat));

      dir = ori.transform(dir);

      speed = vel.magnitude();

      speed += controls.thrust * Delta * 5;

      if (speed < 0) { speed = 0; }

      vel = dir.multiplyConst(speed);

      pos = pos.add(vel.multiplyConst(Delta));

      dmz.object.position (hil, null, pos);
      dmz.object.orientation (hil, null, ori);
      dmz.object.velocity (hil, null, vel);
   }
});

dmz.input.channel.observe(self, function (Channel, State) {

   if (State) { active++; }
   else { active--; }
});

dmz.input.axis.observe(self, function (Channel, Axis) {

self.log.error(JSON.stringify(Axis));

   if (Axis.id == 1) { // Roll

      controls.roll = Axis.value;
   }
   else if (Axis.id == 2) { // thrust

      controls.thrust = -Axis.value;
   }
   else if (Axis.id == 7) { // Pitch

      controls.pitch = Axis.value;
   }
});
