# frozen_string_literal: true

require "livekit"

module MessageType
  IdentifyReq = 0
  SubscribeToken = 1
end

# Websocket message
class Message
  def initialize(type, data)
    @type = type
    @data = data
  end

  def json
    { "type" => @type, "data" => @data }.to_json
  end
end

# Manager for FiveStream server
class FiveStreamManager
  def initialize
    @instance_address = "http://0.0.0.0:7880"
    @api_key = "devkey"
    @api_secret = "secret"

    @rsc =
      LiveKit::RoomServiceClient.new(
        @instance_address,
        api_key: @api_key,
        api_secret: @api_secret
      )
    @room = "fivestream"
    @rsc.create_room(@room)
  end

  def generate_jwt(name, can_stream)
    token =
      LiveKit::AccessToken.new(
        api_key: @api_key,
        api_secret: @api_secret,
        name: name,
        identity: name
      )
    token.add_grant(
      roomJoin: true,
      canSubscribe: true,
      canPublish: can_stream,
      canPublishData: can_stream,
      room: @room
    )

    token.to_jwt
  end

  def upgrade(id, slot)
    @rsc.update_participant(
      room: @room,
      identity: id,
      metadata: slot.to_s,
      permission: perm
    )
    # permission: { 'can_subscribe' => true, 'can_publish' => true, 'can_publish_data' => true })
  end
end
