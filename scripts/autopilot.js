var dmz =
       { object: require("dmz/components/object")
       , event: require("dmz/components/event")
       , common: require("dmz/components/eventCommon")
       , overlay: require("dmz/components/overlay")
       , input: require("dmz/components/input")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       , rotate: require("rotate")
       , consts: require("consts")
       }
,   battlestar
,   autopilot = 0
,   light = dmz.overlay.lookup("autopilot-light")
,   start
,   launchOffset = dmz.vector.create()
//  Constants
,   TubeAttr = dmz.defs.createNamedHandle("Launch_Tube")
,   Forward = dmz.vector.create(0, 0, -1)
,   Up = dmz.vector.create(0, 1, 0)
,   Right = dmz.vector.create(1, 0, 0)
,   Turn90 = dmz.matrix.create().fromAxisAndAngle(Up, -Math.PI * 0.5)
,   ZeroVector = dmz.vector.create()
,   IMat = dmz.matrix.create()
,   Red = dmz.overlay.color("bar-red")
,   Yellow = dmz.overlay.color("bar-yellow")
,   Green = dmz.overlay.color("bar-green")
,   DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
,   StandByState = dmz.defs.lookupState("Stand_By")
,   MaxSpeed = 55.556 // meters per second -> 200 kilometers per hour
,   Acceleration = 60
,   APMode = dmz.consts.APMode
//  Functions
,   dock
,   launchTimeSlice
,   landTimeSlice
,   isAPMode
;


if (!light) { self.log.error("Unable to find autopilot light"); }


dock = function () {

   var pos
   ,   ori
   ,   vel = ZeroVector
   ,   hil = dmz.object.hil()
   ;

   dmz.time.cancleTimer(self, landTimeSlice);

   if (hil) {

      if (battlestar) {

         ori = dmz.object.orientation(battlestar);
         pos = dmz.object.position(battlestar).add(ori.transform (launchOffset));
         ori = ori.multiply(Turn90);
      }
      else {

         pos = ZeroVector;
         ori = IMat;
      }

      dmz.object.position(hil, null, pos);
      dmz.object.orientation(hil, null, ori);
      dmz.object.velocity(hil, null, vel);
      dmz.object.counter (hil, "autopilot", APMode.Docked);
   }
};


isAPMode = function (Mode) {

   var result = false
   ,   ix = 1
   ;

   while (!result && (ix < arguments.length)) {

      if (Mode == arguments[ix]) { result = true; }
      else { ix++; }
   }

   return result;
};


launchTimeSlice = function (Delta) {

   var hil = dmz.object.hil()
   ,   pos
   ,   ori
   ,   vel
   ,   dir
   ,   state
   ;

   if (hil && isAPMode(autopilot, APMode.Launching)) {

      pos = dmz.object.position (hil);
      ori = dmz.object.orientation(hil);
      vel = dmz.object.velocity(hil);
      state = dmz.object.state(hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }

      if (!start) { start = pos; }

      if (!state || !state.contains(DeadState)) {

         dir = ori.transform(Forward);
         vel = vel.add(dir.multiplyConst(Acceleration * Delta));
         pos = pos.add(vel.multiplyConst(Delta));
      }

      if (pos.subtract(start).magnitude() > 50) {

         dmz.time.cancleTimer(self, launchTimeSlice);
         dmz.object.counter(hil, "autopilot", APMode.Off);
         start = undefined;
      }

      dmz.object.position (hil, null, pos);
      dmz.object.orientation (hil, null, ori);
      dmz.object.velocity (hil, null, vel);
      dmz.object.state (hil, null, state);
   }
};


landTimeSlice = function (Delta) {

   var hil = dmz.object.hil()
   ,   target
   ,   hvec
   ,   hmat = dmz.matrix.create()
   ,   pvec
   ,   bsOri
   ,   pos
   ,   ori
   ,   targetOri
   ,   vel
   ,   dir
   ,   state
   ,   valid = true
   ;

   if (hil && battlestar) {

      target = dmz.object.position(battlestar);
      bsOri = dmz.object.orientation(battlestar);

      if (!target) { target = dmz.vector.create(); }
      if (!bsOri) { bsOri = dmz.matrix.create(); }

      pos = dmz.object.position(hil);
      ori = dmz.object.orientation(hil);
      vel = dmz.object.velocity(hil);
      state = dmz.object.state(hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }

      if (isAPMode(autopilot, APMode.Off, APMode.Aligning)) {

         target = target.add(bsOri.transform(dmz.vector.create(221.7, -50, -450)));

         if (bsOri.transform(Forward).getAngle(ori.transform(Forward)) <
               (Math.PI * 0.8)) {

            valid = false;
         }
         else { dmz.object.counter(dmz.object.hil(), "autopilot", APMode.Aligning); }
      }
      else if (isAPMode(autopilot, APMode.Landing)) {

         target = target.add(bsOri.transform(dmz.vector.create(221.7, -60, -155.75)));
      }

      if (valid && (!state || !state.contains(DeadState))) {

         dir = target.subtract(pos);

         if (dir.magnitude() < 10) {

            if (isAPMode(autopilot, APMode.Landing)) { dock(); }
            else { dmz.object.counter(hil, "autopilot", APMode.Landing); }
         }

         if (isAPMode(autopilot, APMode.Aligning, APMode.Landing)) {

            targetOri = bsOri.multiply(dmz.matrix.create().fromAxisAndAngle(Up, Math.PI));

            ori = dmz.rotate.align(
               Delta,
               Math.PI * 0.25,
               ori,
               targetOri);

            vel = target.subtract(pos).normalize().multiplyConst(vel.magnitude());

            pos = pos.add(vel.multiplyConst(Delta));

            dmz.object.position(hil, null, pos);
            dmz.object.orientation(hil, null, ori);
            dmz.object.velocity(hil, null, vel);
            dmz.object.state(hil, null, state);
         }
      }
   }
};


dmz.input.button.observe(self, function (Channel, Button) {

   if (Button.id === 1) {

      if (isAPMode(autopilot, APMode.Docked) && Button.value) {

         dmz.object.counter(dmz.object.hil(), "autopilot", APMode.Launching);
         dmz.time.setRepeatingTimer(self, launchTimeSlice);
         dmz.common.createLaunch(dmz.object.hil());
      }
      else if (isAPMode(autopilot, APMode.Aligning) && !Button.value) {

         dmz.time.cancleTimer(self, landTimeSlice);
         dmz.object.counter(dmz.object.hil(), "autopilot", APMode.Off);
      }
      else if (isAPMode (autopilot, APMode.Landing) && Button.value) {

         dmz.time.cancleTimer(self, landTimeSlice);
         dmz.object.counter(dmz.object.hil(), "autopilot", APMode.Off);
      }
      else if (isAPMode(autopilot, APMode.Off)) {

         if (Button.value) {

            dmz.time.setRepeatingTimer(self, landTimeSlice);
         }
         else {

            dmz.time.cancleTimer(self, landTimeSlice);
         }
      }
   }
   else if ((Button.id === 3) && Button.value) { dock(); }
});


dmz.object.destroy.observe(self, function(handle) {

   if (battlestar && (handle === battlestar)) { battlestar = undefined; }
});


dmz.object.counter.observe(self, "autopilot", function (handle, attr, value) {

   if (handle === dmz.object.hil ()) {

      autopilot = value;
      if (light) {

	      if (isAPMode(autopilot, APMode.Aligning)) { light.color(Yellow); }
	      else if (isAPMode(autopilot, APMode.Docked, APMode.Launching, APMode.Landing)) {

            light.color(Green);
         }
         else { light.color(Red); }
      }
   }
});


dmz.object.flag.observe(self, "battlestar", function (handle, attr, value) {

   if (value && !battlestar) {

      battlestar = handle;
      if (isAPMode(autopilot, APMode.Docked)) { dock(); }
   }
});


dmz.object.link.observe(self, TubeAttr, function (link, attr, tube, obj) {

   if (obj == dmz.object.hil()) {

      launchOffset = dmz.object.vector(tube, TubeAttr);
      if (!launchOffset) { launchOffset = dmz.vector.create(); }

      if (isAPMode(autopilot, APMode.Docked)) { dock(); }
   }
});
