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
  , DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
  , ShieldAttr = dmz.defs.createNamedHandle("Shield")
  , KillAttribute = dmz.defs.createNamedHandle("Event_Kill_Attribute")
  , Detonation = dmz.eventType.lookup("Event_Detonation")
  ;

dmz.event.close.observe(self, Detonation, function (Event) {

   var hil = dmz.object.hil ()
     , target = dmz.event.objectHandle(Event, dmz.event.TargetAttribute)
     , type = dmz.event.objectType(Event, dmz.event.MunitionsAttribute)
     , shields = 0
     , out
     , state
     ;

   if (hil === target) {

      shields = dmz.object.addToCounter(hil, ShieldAttr, -1);

      if (shields <= 0) {

         out = dmz.common.createOpenDetonation(hil);
         if (source) { dmz.event.objectHandle(out, KillAttribute, source); }
         dmz.common.close(out);

         state = dmz.object.state(hil);
         if (!state) { state = dmz.mask.create(); }
         state = state.and(DeadState);
         dmz.object.state(hil, null, state);
      }
   }
});
