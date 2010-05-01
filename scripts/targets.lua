local Forward = dmz.vector.new {0.0, 0.0, -1.0}
local Right = dmz.vector.new {1.0, 0.0, 0.0}
local Up = dmz.vector.new {0.0, 1.0, 0.0}
local StartDir = dmz.matrix.new ():from_axis_and_angle (Up, dmz.math.Pi)

local function create_base_star ()
   local handle = dmz.object.create ("base-star")
   dmz.object.position (handle, nil, dmz.vector.new (0, 0, -2000))
   dmz.object.activate (handle)
   dmz.object.set_temporary (handle)
end

local function random_vector (value)
   if not value then value = 500 end
   local halfValue = value * 0.5
   return dmz.vector.new (
      math.random () * value - halfValue,
      math.random () * value - halfValue,
      math.random () * value - halfValue)
end

local function rotate (time, orig, target)
   local diff = target - orig
   if diff > dmz.math.Pi then diff = diff - dmz.math.TwoPi
   elseif diff < -dmz.math.Pi then diff = diff + dmz.math.TwoPi
   end
   local max = time * dmz.math.Pi
   if math.abs (diff) > max then
      if diff > 0 then target = orig + max
      else target = orig - max
      end
   end
   return target
end

local function new_ori (obj, time, targetVec)
   local result = dmz.matrix.new ()
   local hvec = dmz.vector.new (targetVec)
   hvec:set_y (0.0)
   hvec = hvec:normalize ()
   local heading = Forward:get_angle (hvec)
   local hcross = Forward:cross (hvec):normalize ()
   if hcross:get_y () < 0.0 then
      heading = dmz.math.TwoPi - heading
   end
   if heading > dmz.math.Pi then heading = heading - dmz.math.TwoPi
   elseif heading < -dmz.math.Pi then heading = heading + dmz.math.TwoPi
   end
   local pitch = targetVec:get_angle (hvec)
   local pcross = targetVec:cross (hvec):normalize ()
   local ncross = hvec:cross (pcross)
   if ncross:get_y () < 0.0 then
      pitch = dmz.math.TwoPi - pitch
   end
   obj.heading = rotate (time, obj.heading, heading)
   obj.pitch = rotate (time, obj.pitch, pitch)
   if dmz.math.is_zero (obj.heading - heading) and
         dmz.math.is_zero (obj.pitch - pitch) then obj.onTarget = true end
   local pm = dmz.matrix.new ():from_axis_and_angle (Right, pitch)
   result = result:from_axis_and_angle (Up, heading);
   result = result * pm
   return result;
end

local function update_time_slice (self, time)
   local count = 0
   while (count < 10) and (self.targetCount < self.maxTargetCount) do
      count = count + 1
      local handle = dmz.object.create (self.targetType)
      dmz.object.position (handle, nil, random_vector () + dmz.vector.new (0, 0, -1500))
      dmz.object.orientation (handle, nil, StartDir)
      dmz.object.velocity (handle, nil, dmz.vector.new (0, 0, self.targetSpeed))
      dmz.object.activate (handle)
      dmz.object.set_temporary (handle)
      self.targetCount = self.targetCount + 1
      local obj = {
         start = dmz.object.position (handle),
         point = random_vector (50),
         heading = dmz.math.Pi,
         pitch = 0,
         onTarget = false,
         dir = Forward,
      }
      obj.distance = (obj.point - obj.start):magnitude ()
      self.targets[handle] = obj
   end
   for handle, obj in pairs (self.targets) do
      local pos = dmz.object.position (handle)
      local ori = dmz.object.orientation (handle)
      local vel = dmz.object.velocity (handle)
      local offset = obj.point - pos
      local targetDir = offset:normalize ()
      if not obj.onTarget then ori = new_ori (obj, time, targetDir) end
      if (obj.start - pos):magnitude () > obj.distance then
         obj.point = random_vector ()
         obj.start = pos
         obj.distance = (obj.point - obj.start):magnitude ()
         obj.onTarget = false
      end
      vel = ori:transform (Forward) * self.targetSpeed
      dmz.object.position (handle, nil, pos + (vel * time))
      dmz.object.orientation (handle, nil, ori)
      dmz.object.velocity (handle, nil, vel)
   end
end

local function close_event (self, handle, eventType, locality)
   local target = dmz.event.object_handle (handle, dmz.event.TargetHandle)
   if self.targets[target] then
      local out = dmz.event.open_detonation (target)
      local source = dmz.event.object_handle (handle, dmz.event.SourceHandle)
      if source then dmz.event.object_handle (out, "Event_Kill_Attribute", source) end
      dmz.event.close (out)
      dmz.object.destroy (target);
      self.targets[target] = nil
      self.targetCount = self.targetCount - 1
   end
end

local function start_plugin (self) 
   self.tickHandle = self.tick:create (update_time_slice, self, self.name)
   local cb = { close_event = close_event }
   self.event:register ("Event_Detonation", cb, self)
   create_base_star ()
end

function new (config, name)
   local self = {
      name = name,
      start_plugin = start_plugin,
      event = dmz.event_observer.new (),
      tick = dmz.time_slice.new (),
      log = dmz.log.new ("lua." .. name),
      targets = {},
      targetCount = 0,
      maxTargetCount = 200,
      targetType = dmz.object_type.new ("raider"),
      targetSpeed = 40,
   }

   self.log:info ("Creating plugin:", name)

   return self
end
