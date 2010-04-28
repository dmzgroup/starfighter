var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , event: require("dmz/components/event")
       , input: require("dmz/components/input")
       , isect: require("dmz/components/isect")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       , rotate: require("rotate")
       }
//  Constants
,   DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
,   StandByState = dmz.defs.lookupState("Stand_By")
,   TubeAttr = dmz.defs.createNamedHandle("Launch_Tube")
,   TubeType = dmz.objectType.lookup("launch-tube")
,   Viper2Type = dmz.objectType.lookup("viper-2")
,   Viper7Type = dmz.objectType.lookup("viper-7")
,   XPitch = dmz.vector.create(1, 0, 0)
,   YYaw = dmz.vector.create(0, 1, 0)
,   ZRoll = dmz.vector.create(0, 0, -1)
,   TubeX = 227 // 273.8693
,   TubeY = -71
,   TubeSpacing = 18.5
,   TubeCount = 9
//  Variables
,   tubes = new Array(TubeCount)
//  Functions
;

(function () {

   var ix, tube;

   for (ix = 0; ix < TubeCount; ix++) {

      tube =
         { handle: dmz.object.create(TubeType)
         , offset: dmz.vector.create(TubeX, TubeY, -17.975 + (TubeSpacing * ix))
         };

      dmz.object.vector(tube.handle, TubeAttr, tube.offset);
      dmz.object.activate(tube.handle);

      tubes[ix] = tube;
   }
}) ();


dmz.object.create.observe(self, function (handle, type) {

   var place = 0;

   if (type.isOfType(Viper2Type) || type.isOfType(Viper7Type)) {

      while (place < TubeCount) {

         if (tubes[place].obj) { place++; }
         else {

            dmz.object.link(TubeAttr, tubes[place].handle, handle);
            dmz.object.addToCounter(tubes[place].handle, TubeAttr);
            tubes[place].obj = handle;
            place = TubeCount; // quit looking
         }
      }
   }
});


dmz.object.unlink.observe(self, TubeAttr, function (link, attr, tube, obj) {

   var place = 0;

   while (place < TubeCount) {

      if ((tubes[place].handle === tube) && (tubes[place].obj === obj)) {

         tubes[place].obj = undefined;
      }

      place++;
   }
});

