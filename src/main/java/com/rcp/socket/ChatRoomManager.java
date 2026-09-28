package com.rcp.socket;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

public class ChatRoomManager {
    private static final ConcurrentHashMap<Long, Set<ClientHandler>> rooms = new ConcurrentHashMap<>();

    public static void joinRoom(Long projectId, ClientHandler client) {
        rooms.computeIfAbsent(projectId, k -> new CopyOnWriteArraySet<>()).add(client);
    }

    public static void leaveRoom(Long projectId, ClientHandler client) {
        Set<ClientHandler> clients = rooms.get(projectId);
        if (clients != null) {
            clients.remove(client);
            if (clients.isEmpty()) {
                rooms.remove(projectId);
            }
        }
    }

    public static void broadcast(Long projectId, String message, ClientHandler sender) {
        Set<ClientHandler> clients = rooms.get(projectId);
        if (clients != null) {
            for (ClientHandler client : clients) {
                client.sendMessage(message);
            }
        }
    }
}
