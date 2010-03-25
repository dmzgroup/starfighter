var dmz = {}
,   active = 0
,   controls = { thrust: 0, roll: 0, yaw: 0, pitch: 0 }
,   DeadState
,   XPitch
,   YYaw
,   ZRoll
,   frame = {}
,   updateFrame
;

dmz.object = require("dmz/components/object");
dmz.event = require("dmz/components/event");
dmz.input = require("dmz/components/input");
dmz.isect = require("dmz/components/isect");
dmz.time = require("dmz/runtime/time");
dmz.vector = require("dmz/types/vector");
dmz.matrix = require("dmz/types/matrix");
dmz.mask = require("dmz/types/mask");
dmz.defs = require("dmz/runtime/definitions");
dmz.util = require("dmz/types/util");

DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName);

frame.nose = dmz.vector.create([0, 1, -4.1]);
frame.tail = dmz.vector.create([0, 1, 3.861]);
frame.center = dmz.vector.create([0, 1, -1]);
frame.left = dmz.vector.create([-2.431321, 0.060074, 3.237302]);
frame.right = dmz.vector.create([2.431321, 0.060074, 3.237302]);
frame.top = dmz.vector.create([0, 2.85, 3.387]);

updateFrame = function (pos, dir, frame) {

   var result = {}
   , keys = Object.keys(frame)
   ;

   keys.forEach (function (key) {

      result[key] = dir.transform(frame[key]).add(pos);
   });

   return result;
}

XPitch = dmz.vector.create(1, 0, 0);
YYaw = dmz.vector.create(0, 1, 0);
ZRoll = dmz.vector.create(0, 0, -1);

dmz.time.setRepeatingTimer(self, function (Delta) {

   var hil = dmz.object.hil()
   ,   state = dmz.object.state(hil)
   ,   speed = 0
   ,   dir = dmz.vector.create(0, 0, -1)
   ,   pos
   ,   oldPos
   ,   vel
   ,   ori
   ,   pMat
   ,   yMat
   ,   rMat
   ,   DeltaXPi = Delta * Math.PI
   ,   cframe
   ,   hit = false
   ;

   if (hil && (active > 0) && (!state || !state.contains(DeadState))) {

      pos = dmz.object.position (hil);
      ori = dmz.object.orientation (hil);
      vel = dmz.object.velocity (hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }

      oldPos = pos.copy ();

      pMat = dmz.matrix.create().fromAxisAndAngle(XPitch, controls.pitch * DeltaXPi);
      yMat = dmz.matrix.create().fromAxisAndAngle(YYaw, controls.yaw * DeltaXPi);
      rMat = dmz.matrix.create().fromAxisAndAngle(ZRoll, controls.roll * DeltaXPi);

      ori = ori.multiply(yMat.multiply(pMat.multiply(rMat)));

      dir = ori.transform(dir);

      speed = vel.magnitude();

      if (controls.thrust < 0) { speed += controls.thrust * Delta * 50;}
      else { speed += controls.thrust * Delta * 15; }

      if (speed < 0) { speed = 0; }

      vel = dir.multiplyConst(speed);

      pos = pos.add(vel.multiplyConst(Delta));

      cframe = updateFrame (pos, ori, frame);

      dmz.isect.disable(hil);

      dmz.isect.doIsect([
         { start: cframe.nose, end: cframe.tail, callback: function (value) {

            self.log.warn("Nose collision", value.object);
            hit = true;
         }},
         { start: cframe.center, end: cframe.left, callback: function (value) {

            self.log.warn("Left collision", value.object);
            hit = true;
         }},
         { start: cframe.center, end: cframe.right, callback: function (value) {

            self.log.warn("Right collision", value.object);
            hit = true;
         }},
         { start: cframe.center, end: cframe.top, callback: function (value) {

            self.log.warn("Top collision", value.object);
            hit = true;
         }},
      ]);

      dmz.isect.enable(hil);

      if (hit) {

         pos = oldPos;
         vel.set(0, 0, 0);
         if (!state) { state = dmz.mask.create(); }
         state = state.or(DeadState);
      }

      dmz.object.position (hil, null, pos);
      dmz.object.orientation (hil, null, ori);
      dmz.object.velocity (hil, null, vel);
      dmz.object.state (hil, null, state);
   }
});

dmz.input.channel.observe(self, function (Channel, State) {

   if (State) { active++; }
   else { active--; }
});

dmz.input.axis.observe(self, function (Channel, Axis) {

//self.log.error(JSON.stringify(Axis));

   if (Axis.id == 3) { // Roll

      controls.roll = Axis.value;
   }
   else if (Axis.id == 2) { // thrust

      controls.thrust = -Axis.value;
   }
   else if (Axis.id == 1) { // Yaw

      controls.yaw = -Axis.value;
   }
   else if (Axis.id == 4) { // Pitch

      controls.pitch = Axis.value;
   }
});
