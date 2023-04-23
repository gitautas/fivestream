# frozen_string_literal: true

require 'sinatra'
require 'sinatra-websocket'
require 'json'

require './src/five'

set :servers, 'thin'
set :sockets, []
set :port, 7001

$manager = FiveStreamManager.new
$slots = {
  1 => nil,
  2 => nil,
  3 => nil,
  4 => nil,
  5 => nil
}

get '/users' do
  settings.sockets
end

get '/ws' do
  request.websocket do |ws|
    puts 'New request'

    ws.onopen do
      puts "Opened conn #{ws}"
      settings.sockets << ws
    end

    ws.onmessage do |msg|
      message_handler(msg, ws)
    end

    ws.onclose do
      puts "Opened conn #{ws}"
      settings.sockets.delete(ws)
    end
  end
end

def message_handler(msg, ws)
  message = JSON.parse(msg)

  case message['type']

  when MessageType::IdentifyReq
    name = message['data']
    token = $manager.generate_jwt(name, true)
    resp = Message.new(MessageType::SubscribeToken, token)

    puts "Sending response: #{resp.json}"
    ws.send(resp.json)

    upgrade_slot = nil
    $slots.each do |slot|
      if $slots[slot].nil?
        upgrade_slot = slot
        break
      end
    end

    upgrade_to_slot(name, upgrade_slot, ws) unless upgrade_slot.nil?

  end
end

def upgrade_to_slot(id, slot, ws)
  $slots[slot] = ws
  $manager.upgrade(id, slot)
end
