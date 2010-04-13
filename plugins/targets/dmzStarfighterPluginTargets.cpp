#include <dmzEventCallbackMasks.h>
#include <dmzEventConsts.h>
#include <dmzObjectConsts.h>
#include "dmzStarfighterPluginTargets.h"
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


dmz::StarfighterPluginTargets::StarfighterPluginTargets (
      const PluginInfo &Info,
      Config &local) :
      Plugin (Info),
      TimeSlice (Info),
      EventObserverUtil (Info, local),
      _log (Info),
      _defs (Info),
      _objMod (0),
      _common (0),
      _defaultObjHandle (0),
      _defaultEventHandle (0),
      _targetEventHandle (0),
      _maxTargetCount (100),
      _targetSpeed (40.0),
      _startPos (0.0, 0.0, -1500.0) {

   _init (local);
}


dmz::StarfighterPluginTargets::~StarfighterPluginTargets () {

}


// Plugin Interface
void
dmz::StarfighterPluginTargets::update_plugin_state (
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
dmz::StarfighterPluginTargets::discover_plugin (
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
dmz::StarfighterPluginTargets::update_time_slice (const Float64 TimeDelta) {

   if (_objMod) {

      if (_targetTable.get_count () < _maxTargetCount) {

         Int32 count (0);

         while ((count < 10) && (_targetTable.get_count () < _maxTargetCount)) {

            count++;

            const Handle Target = _objMod->create_object (_targetType, ObjectLocal);

            if (Target) {

               TargetStruct *ts = new TargetStruct (Target);

               if (ts && _targetTable.store (Target, ts)) {

                  ts->start = random_vector (500.0) + _startPos;

                  _objMod->store_position (
                     Target,
                     _defaultObjHandle,
                     ts->start);

                  _objMod->store_orientation (
                     Target,
                     _defaultObjHandle,
                     _startDir);

                  ts->point = random_vector (50.0);

                  ts->distance = (ts->point - ts->start).magnitude ();

                  Vector vel (Forward * _targetSpeed);

                  _startDir.transform_vector (vel);

                  _objMod->store_velocity (Target, _defaultObjHandle, vel);

                  _objMod->activate_object (Target);
               }
               else if (ts) {

                  _objMod->destroy_object (Target);
                  delete ts; ts = 0; 
               }
            }
         }
      }

      HashTableHandleIterator it;
      TargetStruct *ts (0);

      while (_targetTable.get_next (it, ts)) {

         Vector pos, vel;
         Matrix ori;

         _objMod->lookup_position (ts->Object, _defaultObjHandle, pos);
         _objMod->lookup_velocity (ts->Object, _defaultObjHandle, vel);
         _objMod->lookup_orientation (ts->Object, _defaultObjHandle, ori);

         Vector offset (ts->point - pos), targetDir (offset.normalize ()), dir (Forward);

         if (!ts->onTarget) { _new_ori (TimeDelta, targetDir, *ts, ori); }

         if ((pos - ts->start).magnitude () > ts->distance) {

            ts->point = random_vector (500.0);
            ts->start = pos;
            ts->distance = (ts->start - ts->point).magnitude ();
            ts->onTarget = False;
         }

         ori.transform_vector (dir);
         vel = dir * _targetSpeed;
         pos = pos + (vel * TimeDelta);

         _objMod->store_position (ts->Object, _defaultObjHandle, pos);
         _objMod->store_velocity (ts->Object, _defaultObjHandle, vel);
         _objMod->store_orientation (ts->Object, _defaultObjHandle, ori);
      }
   }
}


// Event Observer Interface
void
dmz::StarfighterPluginTargets::close_event (
      const Handle EventHandle,
      const EventType &Type,
      const EventLocalityEnum Locality) {

   EventModule *event = get_event_module ();

   if (event) {

      Handle target (0);

      if (event->lookup_object_handle (EventHandle, _targetEventHandle, target)) {

         TargetStruct *ts = _targetTable.remove (target);

         if (ts) {

            if (_common) { _common->create_detonation_event (target, 0); }
            if (_objMod) { _objMod->destroy_object (target); }
            delete ts; ts = 0;
         }
      }
   }
}


dmz::Float64
dmz::StarfighterPluginTargets::_rotate (
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
dmz::StarfighterPluginTargets::_new_ori (
      const Float64 DeltaTime,
      const Vector &Dir,
      TargetStruct &obj,
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

   if (is_zero64 (pitch - obj.pitch) && is_zero64 (heading - obj.heading)) {

      obj.onTarget = true;
   }

   Matrix hm (Up, obj.heading);

   Matrix pm (Right, obj.pitch);

   ori = hm * pm;
}


void
dmz::StarfighterPluginTargets::_init (Config &local) {

   RuntimeContext *context = get_plugin_runtime_context ();

   _defaultObjHandle = _defs.create_named_handle (ObjectAttributeDefaultName);
   _defaultEventHandle = _defs.create_named_handle (EventAttributeDefaultName);
   _targetEventHandle = _defs.create_named_handle (EventAttributeTargetName);

   _targetType = config_to_object_type ("target-type.name", local, "raider", context);

   _detonationType = config_to_event_type (
      "detonation-type.name",
      local,
      EventDetonationName,
      context);

   _startPos = config_to_vector ("start-position", local, _startPos);

   _startDir.from_axis_and_angle_radians (
      Up,
      config_to_float64 ("start-heading.value", local, Pi64));

   _maxTargetCount = config_to_int32 ("max-targets.value", local, _maxTargetCount);

   _log.info << "Max Targets: " << _maxTargetCount << endl;

   activate_event_callback (_detonationType, EventCloseMask);
}


extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL dmz::Plugin *
create_dmzStarfighterPluginTargets (
      const dmz::PluginInfo &Info,
      dmz::Config &local,
      dmz::Config &global) {

   return new dmz::StarfighterPluginTargets (Info, local);
}

};
