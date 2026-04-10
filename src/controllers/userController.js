const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");
const { admin, db } = require("../config/firebase");

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").lean();

  res.status(200).json({
    success: true,
    message: "Users list fetched successfully",
    count: users.length,
    data: users,
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${req.params.id} does not exist in the connected database.`,
    });
  }
  res.status(200).json({ success: true, data: user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const fieldsToUpdate = [
    "name",
    "bio",
    "profileImg",
    "dob",
    "gender",
    "nickname",
    "isAdmin",
  ];

  fieldsToUpdate.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  const updatedUser = await user.save();
  const firebaseUpdate = {};
    if (req.body.name) firebaseUpdate.displayName = req.body.name;
    if (req.body.profileImg) firebaseUpdate.photoURL = req.body.profileImg;

    if (Object.keys(firebaseUpdate).length > 0) {
      await admin.auth().updateUser(user._id.toString(), firebaseUpdate);
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isDeleted = true;
  user.deletedBy = req.user?._id;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User soft-deleted successfully",
  });
});

exports.updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.profileImg && user.profileImg.includes("cloudinary")) {
    const filename = user.profileImg.split("/").pop();
    const publicId = filename.split(".")[0];
    cloudinary.uploader
      .destroy(`user_profiles/${publicId}`)
      .catch((err) => console.log("Cloudinary Delete Error:", err));
  }

  const imageUrl = req.file.path || req.file.secure_url || req.file.url;
  user.profileImg = imageUrl;
  const updatedUser = await user.save();
  res.status(200).json({
    success: true,
    message: "Profile image updated successfully",
    data: {
      _id: updatedUser._id,
      profileImg: updatedUser.profileImg,
    },
  });
});

// exports.createChatRoom = asyncHandler(async (req, res) => {
//   const { receiverId } = req.body;
//   const senderId = req.user._id.toString();

//   if (!receiverId) {
//     res.status(400);
//     throw new Error("Receiver ID is required");
//   }

//   const targetId = receiverId.toString();

//   if (senderId === targetId) {
//     res.status(400);
//     throw new Error("You cannot create a chat room with yourself");
//   }

//   const roomId = [senderId, targetId].sort().join("_");

//   const roomRef = db.collection("rooms").doc(roomId);

//   const doc = await roomRef.get();

//   if (doc.exists) {
//     return res.status(200).json({
//       success: true,
//       message: "Chat room already exists",
//       data: { roomId, alreadyExisted: true }
//     });
//   }

//   const newRoom = {
//     participants: [senderId, targetId],
//     createdAt: admin.firestore.FieldValue.serverTimestamp(),
//     lastMessage: {
//       text: "Chat started",
//       senderId: senderId,
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     },
//     updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     participantIds: [senderId, targetId], 
//   };

//   await roomRef.set(newRoom);

//   res.status(201).json({ 
//     success: true, 
//     message: "New chat room created",
//     data: { roomId, alreadyExisted: false } 
//   });
// });

exports.createChatRoom = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id.toString();

  if (!receiverId) {
    res.status(400);
    throw new Error("Receiver ID is required");
  }

  const targetId = receiverId.toString();

  if (senderId === targetId) {
    res.status(400);
    throw new Error("You cannot create a chat room with yourself");
  }

  // --- NEW: Firebase Existence Check ---
  const checkAndRegisterFirebase = async (mongoUser) => {
    try {
      // Check if user exists in Firebase
      return await admin.auth().getUser(mongoUser._id.toString());
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Register the user in Firebase if they exist in Mongo but not Firebase
        return await admin.auth().createUser({
          uid: mongoUser._id.toString(),
          email: mongoUser.email,
          displayName: mongoUser.name,
          // Since we don't have the plain text password here, we omit it. 
          // They can still login via custom tokens.
        });
      }
      throw error;
    }
  };

  // Ensure both users exist in Firebase
  const receiverUser = await User.findById(targetId);
  if (!receiverUser) {
    res.status(404);
    throw new Error("Receiver does not exist in our database");
  }

  // Run checks for both (Sender is req.user, Receiver is receiverUser)
  await Promise.all([
    checkAndRegisterFirebase(req.user),
    checkAndRegisterFirebase(receiverUser)
  ]);

  // --- Existing Room Logic ---
  const roomId = [senderId, targetId].sort().join("_");
  const roomRef = db.collection("rooms").doc(roomId);
  const doc = await roomRef.get();

  if (doc.exists) {
    return res.status(200).json({
      success: true,
      message: "Chat room already exists",
      data: { roomId, alreadyExisted: true }
    });
  }

  const newRoom = {
    participants: [senderId, targetId],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessage: {
      text: "Chat started",
      senderId: senderId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    participantIds: [senderId, targetId], 
  };

  await roomRef.set(newRoom);

  res.status(201).json({ 
    success: true, 
    message: "New chat room created",
    data: { roomId, alreadyExisted: false } 
  });
});

exports.getChatHistory = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const limit = parseInt(req.query.limit) || 20;

  const messagesSnapshot = await db.collection("rooms")
    .doc(roomId)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const messages = messagesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  res.status(200).json({ success: true, data: messages });
});

exports.getUserChatList = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const roomsSnapshot = await db.collection("rooms")
    .where("participantIds", "array-contains", userId)
    .orderBy("updatedAt", "desc")
    .get();

  if (roomsSnapshot.empty) {
    return res.status(200).json({ success: true, data: [] });
  }

  const chatList = await Promise.all(
    roomsSnapshot.docs.map(async (doc) => {
      const roomData = doc.data();
      
      const otherUserId = roomData.participantIds.find(id => id !== userId);

      const otherUser = await User.findById(otherUserId)
        .select("name profileImg nickname")
        .lean();

      return {
        roomId: doc.id,
        lastMessage: roomData.lastMessage,
        updatedAt: roomData.updatedAt,
        otherUser: otherUser || { name: "Unknown User", profileImg: "" },
      };
    })
  );

  res.status(200).json({
    success: true,
    data: chatList,
  });
});