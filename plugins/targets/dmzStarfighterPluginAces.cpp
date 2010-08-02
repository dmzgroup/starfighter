#include <dmzEventCallbackMasks.h>
#include <dmzEventConsts.h>
#include <dmzObjectConsts.h>
#include <dmzObjectAttributeMasks.h>
#include "dmzStarfighterPluginAces.h"
#include <dmzSystem.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimeConfigToVector.h>
#include <dmzRuntimePluginInfo.h>

using namespace dmz;

namespace {

static const Vector Right (1.0, 0.0, 0.0);
static const Vector Up (0.0, 1.0, 0.0);
static const Vector Forward (0.0, 0.0, -1.0);

static Vector
random_vector (const Float64 Offset) {

   const Float64 HalfValue = Offset * 0.5;

   return Vector (
      (random () * Offset) - HalfValue,
      (random () * Offset) - HalfValue,
      (random () * Offset) - HalfValue);
}

};


dmz::StarfighterPluginAces::StarfighterPluginAces (
      const PluginInfo &Info,
      Config &local) :
      Plugin (Info),
      TimeSlice (Info),
      ObjectObserverUtil (Info, local),
      EventObserverUtil (Info, local),
      _log (Info),
      _defs (Info),
      _objMod (0),
      _common (0),
      _defaultObjAttr (0),
      _defaultEventAttr (0),
      _targetEventAttr (0),
      _killsEventAttr (0),
      _convert (Info),
      _maxAceCount (5),
      _aceSpeed (40.0),
      _startPos (0.0, 0.0, -1500.0) {

   _init (local);
}


dmz::StarfighterPluginAces::~StarfighterPluginAces () {

}


// Plugin Interface
void
dmz::StarfighterPluginAces::update_plugin_state (
      const PluginStateEnum State,
      const UInt32 Level) {

   if (State == PluginStateInit) {

   }
   else if (State == PluginStateStart) {

   }
   else if (State == PluginStateStop) {

   }
   else if (State == PluginStateShutdown) {

   }
}


void
dmz::StarfighterPluginAces::discover_plugin (
      const PluginDiscoverEnum Mode,
      const Plugin *PluginPtr) {

   if (Mode == PluginDiscoverAdd) {

      if (!_objMod) { _objMod = ObjectModule::cast (PluginPtr); }
      if (!_common) { _common = EventModuleCommon::cast (PluginPtr); }
   }
   else if (Mode == PluginDiscoverRemove) {

      if (_objMod && (_objMod == ObjectModule::cast (PluginPtr))) { _objMod = 0; }
      if (_common && (_common == EventModuleCommon::cast (PluginPtr))) { _common = 0; }
   }
}


// TimeSlice Interface
void
dmz::StarfighterPluginAces::update_time_slice (const Float64 TimeDelta) {

   if (_objMod) {

      if (_aceTable.get_count () < _maxAceCount) {

         Int32 count (0);

         while ((count < 10) && (_aceTable.get_count () < _maxAceCount)) {

            count++;

            const Handle Target = _objMod->create_object (_aceType, ObjectLocal);

            if (Target) {

               AceStruct *as = new AceStruct (Target);

               if (as && _aceTable.store (Target, as)) {

                  as->start = random_vector (500.0) + _startPos;

                  _objMod->store_position (
                     Target,
                     _defaultObjAttr,
                     as->start);

                  _objMod->store_orientation (
                     Target,
                     _defaultObjAttr,
                     _startDir);

                  as->point = random_vector (50.0);

                  as->distance = (as->point - as->start).magnitude ();

                  Vector vel (Forward * _aceSpeed);

                  _startDir.transform_vector (vel);

                  _objMod->store_velocity (Target, _defaultObjAttr, vel);

                  _objMod->activate_object (Target);
               }
               else if (as) {

                  _objMod->destroy_object (Target);
                  delete as; as = 0; 
               }
            }
         }
      }

      HashTableHandleIterator it;
      AceStruct *as (0);

      while (_aceTable.get_next (it, as)) {

         Vector pos, vel;
         Matrix ori;

         _objMod->lookup_position (as->Object, _defaultObjAttr, pos);
         _objMod->lookup_velocity (as->Object, _defaultObjAttr, vel);
         _objMod->lookup_orientation (as->Object, _defaultObjAttr, ori);

         if ((as->flyoff < 0.0) && !as->target) { as->target = _find_target (); }

         if (as->target) {

            Vector targetPos;
            Matrix targetOri;

            if (_objMod->lookup_position (as->target, _defaultObjAttr, targetPos) &&
                  _objMod->lookup_orientation (as->target, _defaultObjAttr, targetOri)) {

               Vector f (Forward);
               f = f * 6.0;
               targetPos += targetOri.transform_vector (f);
               Vector offset = targetPos - pos;
               Vector targetDir = offset.normalize ();

               if (as->flyoff < 0.0) { _new_ori (TimeDelta, targetDir, *as, ori); }

               Float64 distance = offset.magnitude ();

               if ((distance < 200.0) && (distance > 10.0)) {

                  Vector f (Forward);
              
                  if (ori.transform_vector (f).get_angle (offset) < (Pi64 * 0.1)) {

                     Data out = _convert.to_data (as->Object);
                     _launchMsg.send (&out);
                  }
               }

               if ((as->flyoff < 0.0) && (distance <= 30.0)) {

                  as->flyoff = (dmz::random () * 100.0) + 100.0;
               }
            }
            else { as->target = 0; }
         }

         Float64 speed = vel.magnitude ();

         Vector dir (Forward);
         ori.transform_vector (dir);
         vel = dir * speed;
         Vector origPos (pos);
         pos += vel * TimeDelta;

         if (as->flyoff >= 0.0) {

            as->flyoff -= (pos - origPos).magnitude ();

            if (as->flyoff < 0.0) {

               as->flyoff = -1.0;
               as->target = 0;
            }
         }

         _objMod->store_position (as->Object, _defaultObjAttr, pos);
         _objMod->store_orientation (as->Object, _defaultObjAttr, ori);
         _objMod->store_velocity (as->Object, _defaultObjAttr, vel);
      }
   }
}


// Object Observer Interface
void
dmz::StarfighterPluginAces::create_object (
      const UUID &Identity,
      const Handle ObjectHandle,
      const ObjectType &Type,
      const ObjectLocalityEnum Locality) {

   if (Type.is_of_type (_targetType)) { _targets.add (ObjectHandle); }
}



void
dmz::StarfighterPluginAces::destroy_object (
      const UUID &Identity,
      const Handle ObjectHandle) {

   _targets.remove (ObjectHandle);
}


// Event Observer Interface
void
dmz::StarfighterPluginAces::close_event (
      const Handle EventHandle,
      const EventType &Type,
      const EventLocalityEnum Locality) {

   EventModule *event = get_event_module ();

   if (event) {

      Handle target (0);

      if (event->lookup_object_handle (EventHandle, _targetEventAttr, target)) {

         AceStruct *as = _aceTable.remove (target);

         if (as) {

            if (_common) {

               const Handle Out = _common->create_open_detonation_event (target, 0);
               Handle source (0);
               event->lookup_object_handle (EventHandle, _sourceEventAttr, source);
               event->store_object_handle (Out, _killsEventAttr, source);
               event->close_event (Out);
            }

            if (_objMod) { _objMod->destroy_object (target); }
            delete as; as = 0;
         }
      }
   }
}


dmz::Handle
dmz::StarfighterPluginAces::_find_target () {

   Handle result (0);

   const Int32 Count = _targets.get_count ();

   if (Count > 0) {

      const Int32 Which = (Int32)floor (dmz::random () * (Float64)(Count - 1));

      Int32 place (0);

      HandleContainerIterator it;

      while (place <= Which) {

         _targets.get_next (it, result);
         place++;
      }
   }

   return result;
}


dmz::Float64
dmz::StarfighterPluginAces::_rotate (
      const Float64 DeltaTime,
      const Float64 Start,
      const Float64 Target) {

   Float64 result (Target), diff (Target - Start), max (DeltaTime * Pi64);

   if (diff > Pi64) { diff -= TwoPi64; }
   else if (diff < -Pi64) { diff += TwoPi64; }

   if (fabs (diff) > max) {

      if (diff > 0) { result = Start + max; }
      else { result = Start - max; }
   }

   return result;
}


void
dmz::StarfighterPluginAces::_new_ori (
      const Float64 DeltaTime,
      const Vector &Dir,
      AceStruct &obj,
      Matrix &ori) {

   Vector hvec (Dir);

   hvec.set_y (0.0);
   hvec.normalize_in_place ();

   Float64 heading = Forward.get_angle (hvec);

   Vector hcross = Forward.cross (hvec).normalize ();

   if (hcross.get_y () < 0.0) { heading = TwoPi64 - heading; }

   if (heading > Pi64) { heading = heading - TwoPi64; }
   else if (heading < -Pi64) { heading = heading + TwoPi64; }

   Float64 pitch = Dir.get_angle (hvec);
   Vector pcross = Dir.cross (hvec).normalize ();
   Vector ncross = hvec.cross (pcross);

   if (ncross.get_y () < 0.0) { pitch = TwoPi64 - pitch; }

   obj.heading = _rotate (DeltaTime, obj.heading, heading);

   obj.pitch = _rotate (DeltaTime, obj.pitch, pitch);

   Matrix hm (Up, obj.heading);

   Matrix pm (Right, obj.pitch);

   ori = hm * pm;
}


void
dmz::StarfighterPluginAces::_init (Config &local) {

   RuntimeContext *context = get_plugin_runtime_context ();

   _defaultObjAttr = _defs.create_named_handle (ObjectAttributeDefaultName);
   _defaultEventAttr = _defs.create_named_handle (EventAttributeDefaultName);
   _targetEventAttr = _defs.create_named_handle (EventAttributeTargetName);
   _sourceEventAttr = _defs.create_named_handle (EventAttributeSourceName);
   _killsEventAttr = _defs.create_named_handle ("Event_Kill_Attribute");

   _aceType = config_to_object_type ("ace-type.name", local, "raider", context);

   _targetType = config_to_object_type (
      "target-type.name",
      local,
      "colonial-fighter",
      context);

   _detonationType = config_to_event_type (
      "detonation-type.name",
      local,
      EventDetonationName,
      context);

   _launchMsg = config_create_message (
      "launch-message.name",
      local,
      "Raider_Launch_Message",
      context);

   _startPos = config_to_vector ("start-position", local, _startPos);

   _startDir.from_axis_and_angle (
      Up,
      config_to_float64 ("start-heading.value", local, Pi64));

   _maxAceCount = config_to_int32 ("max-targets.value", local, _maxAceCount);

   _log.info << "Max Targets: " << _maxAceCount << endl;

   activate_default_object_attribute (ObjectCreateMask | ObjectDestroyMask);
   activate_event_callback (_detonationType, EventCloseMask);
}


extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL dmz::Plugin *
create_dmzStarfighterPluginAces (
      const dmz::PluginInfo &Info,
      dmz::Config &local,
      dmz::Config &global) {

   return new dmz::StarfighterPluginAces (Info, local);
}

};
