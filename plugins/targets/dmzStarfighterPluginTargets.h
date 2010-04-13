#ifndef DMZ_STARFIGHTER_PLUGIN_TARGETS_DOT_H
#define DMZ_STARFIGHTER_PLUGIN_TARGETS_DOT_H

#include <dmzEventModule.h>
#include <dmzEventObserverUtil.h>
#include <dmzObjectModule.h>
#include <dmzRuntimeEventType.h>
#include <dmzRuntimeLog.h>
#include <dmzRuntimeObjectType.h>
#include <dmzRuntimePlugin.h>
#include <dmzRuntimeTimeSlice.h>
#include <dmzTypesBase.h>
#include <dmzTypesMatrix.h>
#include <dmzTypesHashTableHandleTemplate.h>
#include <dmzTypesVector.h>

namespace dmz {

   class StarfighterPluginTargets :
         public Plugin,
         public TimeSlice,
         public EventObserverUtil {

      public:
         StarfighterPluginTargets (const PluginInfo &Info, Config &local);
         ~StarfighterPluginTargets ();

         // Plugin Interface
         virtual void update_plugin_state (
            const PluginStateEnum State,
            const UInt32 Level);

         virtual void discover_plugin (
            const PluginDiscoverEnum Mode,
            const Plugin *PluginPtr);

         // TimeSlice Interface
         virtual void update_time_slice (const Float64 TimeDelta);

         // Event Observer Interface
         virtual void close_event (
            const Handle EventHandle,
            const EventType &Type,
            const EventLocalityEnum Locality);

      protected:
         struct TargetStruct {

            const Handle Object;
            Vector start;
            Vector point;
            Vector dir;
            Float64 heading;
            Float64 pitch;
            Boolean onTarget;

            TargetStruct (const Handle TheObject) :
                  Object (TheObject),
                  heading (Pi64),
                  pitch (0.0),
                  onTarget (False) {;}
         };

         Float64 rotate (
            const Float64 DeltaTime,
            const Float64 Start,
            const Float64 Target);

         void new_ori (
            const Float64 DeltaTime,
            const Vector &Dir,
            TargetStruct &obj,
            Matrix &ori);

         void _init (Config &local);

         Log _log;

         ObjectModule *_objMod;

         Handle _defaultObjHandle;
         Handle _defaultEventHandle;
         Handle _targetEventHandle;

         Float64 _maxTargetCount;
         ObjectType _targetType;
         Vector _startPos;
         Matrix _startDir;

         HashTableHandleTemplate<TargetStruct> _targetTable;

      private:
         StarfighterPluginTargets ();
         StarfighterPluginTargets (const StarfighterPluginTargets &);
         StarfighterPluginTargets &operator= (const StarfighterPluginTargets &);

   };
};

#endif // DMZ_STARFIGHTER_PLUGIN_TARGETS_DOT_H
