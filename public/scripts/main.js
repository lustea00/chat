
/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict'

var messageListElement = document.getElementById('contact-list')
var messageListElement2 = document.getElementById('chat-list')

var targetUser = "";

var lastDate = "";

var type = "";

var CONTACT_TEMPLATE = `
  <div class="wrap">
    <div class="meta">
      <p class="name"></p>
    </div>
  </div>
`

var CHAT_TEMPLATE = `
<p class="message">
</p>`

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

window.onload = (event) => {
  type = getParameterByName("type");

  getListContact()
  // getListMessages()
  document.getElementById('chat-input').addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
      sendMessages()
    }
  })
}

function getListContact() {
  if (type == null || type == "") {
    alert("Invalid url");
    return false;
  }
  var query = firebase.firestore().collection('Admin').doc('1').collection('User').orderBy("Time", "asc");

  query.onSnapshot(function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id)
      } else {
        // let message = change.doc.data()
       
        renderContact(change.doc.id, change.doc.id)
      }
    })
  })
}

function renderContact(id, name) {
  var div = document.getElementById("contact-" + id) || displayNewContact(id);

  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.name');

  if (name) { // If the message is text.
    messageElement.innerHTML = messageElement.innerHTML
    .replace(/\n/g, '<br>');
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function () { div.classList.add('visible') }, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  // messageInputElement.focus();
}

function displayNewContact(id) {
  var container = document.createElement('li');
  container.innerHTML = CONTACT_TEMPLATE;
  var div = container;
  div.setAttribute('class', 'contact');
  div.setAttribute('id', "contact-" + id);
  div.setAttribute('onclick', 'getListMessages("' + id + '")');

  var existingMessages = messageListElement.children;
  if (existingMessages.length === 0) {
    messageListElement.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];
    messageListElement.insertBefore(div, messageListNode);
  }

  return div;
}

function getListMessages(userId) {
  if (targetUser != userId) {
    messageListElement2.innerHTML = "";
  }
  targetUser = userId;
  var query = firebase.firestore().collection('Admin').doc('1').collection('User').doc(userId).collection('Messages').orderBy("Time", "asc");
  document.getElementById("chat-frame").classList.remove('hidden');
  document.getElementById("input-frame").classList.remove('hidden');

  query.onSnapshot(function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        var message = change.doc.data();
        if (message.Text)
          renderMessages(change.doc.id, message.Text, message.Time);
      }
    });
  });
}

function renderMessages(id, message, time) {
  var tgl = "";
  var jam = "";
  if (time) {
    var fullDate = time.toDate();
    jam = ("0" + fullDate.getHours()).slice(-2) + ":" + ("0" + fullDate.getMinutes()).slice(-2);
    tgl = ("0" + fullDate.getDate()).slice(-2) + " "  + fullDate.getMonth() + " " + fullDate.getYear();
  }

  var div2 = document.getElementById("tanggal-" + tgl.replace(/ /g, '')) || displayDate(tgl);

  var div = document.getElementById("message-" + id) || displayNewMessages(id);
  
  div.querySelector('.message').innerHTML = message + '<br><span style="text-align: right; width: 100%; font-size: 10px; color: grey;">' + jam + '</span>';
  var messageElement = div.querySelector('.message');
  console.log(tgl);
  
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function () { div.classList.add('visible') }, 1);
  // messageListElement2.lastChild.scrollIntoView();
  messageListElement2.scrollTop = messageListElement2.scrollHeight;
  // messageInputElement.focus();
}

function displayNewMessages(id) {
  var container = document.createElement('li');
  container.innerHTML = CHAT_TEMPLATE;
  const div = container;
  div.setAttribute('id', "message-" + id);
  div.classList.add("replies");

  var existingMessages = messageListElement2.children;
  if (existingMessages.length === 0) {
    messageListElement2.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];
    messageListElement2.appendChild(div)
  }

  return div;
}

function displayDate(tgl) {
  var container = document.createElement('li');
  container.innerHTML = "<div style='text-align: center;'>" + tgl + "</div>";
  const div = container;
  div.setAttribute('id', "tanggal-" + tgl.replace(/ /g, ''));

  var existingMessages = messageListElement2.children;
  if (existingMessages.length === 0) {
    messageListElement2.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];
    messageListElement2.appendChild(div)
  }

  return div;
}

function sendMessages() {
  var message = $(".message-input input").val();

  firebase.firestore().collection('Admin').doc('1').collection('User').doc(targetUser).set({"Time": firebase.firestore.FieldValue.serverTimestamp(), "Text": $('.message-input input').val()});

  firebase.firestore().collection('Admin').doc('1').collection('User').doc(targetUser).collection('Messages').add({
    Text: $('.message-input input').val(),
    In: 0,
    Read: 0,
    Time: firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(function (docRef) {
      $('.message-input input').val(null);
      $('.contact.active .preview').html('<span>You: </span>' + message);
      $(".messages").animate({ scrollTop: $(document).height() }, "fast");
      getListContact();
    })
    .catch(function (error) {
      alert("Terjadi kesalahan");
      console.error("Error adding document: ", error);
    });
}


// anggap saja ini batas

// // Signs-in Friendly Chat.
// function signIn() {
//   // Sign in Firebase using popup auth and Google as the identity provider.
//   var provider = new firebase.auth.GoogleAuthProvider();
//   firebase.auth().signInWithPopup(provider);
// }

// // Signs-out of Friendly Chat.
// function signOut() {
//   // Sign out of Firebase.
//   firebase.auth().signOut();
// }

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged();
}

// // Returns the signed-in user's profile Pic URL.
// function getProfilePicUrl() {
//   return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
// }

// // Returns the signed-in user's display name.
// function getUserName() {
//   return firebase.auth().currentUser.displayName;
// }

// // Returns true if a user is signed-in.
// function isUserSignedIn() {
//   return !!firebase.auth().currentUser;
// }

// // Saves a new message on the Cloud Firestore.
// function saveMessage(messageText) {
//   // Add a new message entry to the Firebase database.
//   //   return firebase.firestore().collection('User').add({
//   //     name: getUserName(),
//   //     text: messageText,
//   //     profilePicUrl: getProfilePicUrl(),
//   //     timestamp: firebase.firestore.FieldValue.serverTimestamp()
//   //   }).catch(function(error) {
//   //     console.error('Error writing new message to Firebase Database', error);
//   //   });
//   // var docRef = firebase.firestore().collection("User").doc('1/Messages/2');
//   // docRef.get().then(function(doc) {
//   //     // Document was found in the cache. If no cached document exists,
//   //     // an error will be returned to the 'catch' block below.
//   //     console.log("Cached document data:", doc.data());
//   // }).catch(function(error) {
//   //     console.log("Error getting cached document:", error);
//   // });
//   firebase.firestore().collection("Admin").doc("3").collection("People").doc("2").collection("Messages").add({
//     Text: "Tes",
//     In: 0,
//     Read: 0,
//     Time: firebase.firestore.FieldValue.serverTimestamp()
//   })
//     .then(function (docRef) {
//       console.log("Document written with ID: ", docRef.id);
//     })
//     .catch(function (error) {
//       console.error("Error adding document: ", error);
//     });
// }

// // Loads chat messages history and listens for upcoming ones.
// function loadMessages() {
//   // Create the query to load the last 12 messages and listen for new ones.
//   var query = firebase.firestore().collection("Admin").doc("3").collection("People").doc("2").collection('Messages').orderBy("timestamp", "asc").limit(5);
//   // var query = firebase.firestore().collection('User').limit(12);

//   // Start listening to the query.
//   query.onSnapshot(function (snapshot) {
//     snapshot.docChanges().forEach(function (change) {
//       if (change.type === 'removed') {
//         deleteMessage(change.doc.id);
//       } else {
//         var message = change.doc.data();
//         console.log(message.Text);
//         displayMessage(change.doc.id, change.doc.id, message.Text,
//           message.text, message.profilePicUrl, message.imageUrl);
//       }
//     });
//   });
// }

// // Saves a new message containing an image in Firebase.
// // This first saves the image in Firebase storage.
// function saveImageMessage(file) {
//   // 1 - We add a message with a loading icon that will get updated with the shared image.
//   firebase.firestore().collection('messages').add({
//     name: getUserName(),
//     imageUrl: LOADING_IMAGE_URL,
//     profilePicUrl: getProfilePicUrl(),
//     timestamp: firebase.firestore.FieldValue.serverTimestamp()
//   }).then(function (messageRef) {
//     // 2 - Upload the image to Cloud Storage.
//     var filePath = firebase.auth().currentUser.uid + '/' + messageRef.id + '/' + file.name;
//     return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
//       // 3 - Generate a public URL for the file.
//       return fileSnapshot.ref.getDownloadURL().then((url) => {
//         // 4 - Update the chat message placeholder with the image’s URL.
//         return messageRef.update({
//           imageUrl: url,
//           storageUri: fileSnapshot.metadata.fullPath
//         });
//       });
//     });
//   }).catch(function (error) {
//     console.error('There was an error uploading a file to Cloud Storage:', error);
//   });
// }

// // Saves the messaging device token to the datastore.
// function saveMessagingDeviceToken() {
//   firebase.messaging().getToken().then(function (currentToken) {
//     if (currentToken) {
//       console.log('Got FCM device token:', currentToken);
//       // Saving the Device Token to the datastore.
//       firebase.firestore().collection('fcmTokens').doc(currentToken)
//         .set({ uid: firebase.auth().currentUser.uid });
//     } else {
//       // Need to request permissions to show notifications.
//       requestNotificationsPermissions();
//     }
//   }).catch(function (error) {
//     console.error('Unable to get messaging token.', error);
//   });
// }

// // Requests permissions to show notifications.
// function requestNotificationsPermissions() {
//   console.log('Requesting notifications permission...');
//   firebase.messaging().requestPermission().then(function () {
//     // Notification permission granted.
//     saveMessagingDeviceToken();
//   }).catch(function (error) {
//     console.error('Unable to get permission to notify.', error);
//   });
// }

// // Triggered when a file is selected via the media picker.
// function onMediaFileSelected(event) {
//   event.preventDefault();
//   var file = event.target.files[0];

//   // Clear the selection in the file picker input.
//   imageFormElement.reset();

//   // Check if the file is an image.
//   if (!file.type.match('image.*')) {
//     var data = {
//       message: 'You can only share images',
//       timeout: 2000
//     };
//     signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
//     return;
//   }
//   // Check if the user is signed-in
//   if (checkSignedInWithMessage()) {
//     saveImageMessage(file);
//   }
// }

// // Triggered when the send new message form is submitted.
// function onMessageFormSubmit(e) {
//   e.preventDefault();
//   // Check that the user entered a message and is signed in.
//   if (messageInputElement.value && checkSignedInWithMessage()) {
//     saveMessage(messageInputElement.value).then(function () {
//       // Clear message text field and re-enable the SEND button.
//       resetMaterialTextfield(messageInputElement);
//       toggleButton();
//     });
//   }
// }

// // Triggers when the auth state change for instance when the user signs-in or signs-out.
// function authStateObserver(user) {
//   if (user) { // User is signed in!
//     // Get the signed-in user's profile pic and name.
//     var profilePicUrl = getProfilePicUrl();
//     var userName = getUserName();

//     // Set the user's profile pic and name.
//     userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
//     userNameElement.textContent = userName;

//     // Show user's profile and sign-out button.
//     userNameElement.removeAttribute('hidden');
//     userPicElement.removeAttribute('hidden');
//     signOutButtonElement.removeAttribute('hidden');

//     // Hide sign-in button.
//     signInButtonElement.setAttribute('hidden', 'true');

//     // We save the Firebase Messaging Device token and enable notifications.
//     saveMessagingDeviceToken();
//   } else { // User is signed out!
//     // Hide user's profile and sign-out button.
//     userNameElement.setAttribute('hidden', 'true');
//     userPicElement.setAttribute('hidden', 'true');
//     signOutButtonElement.setAttribute('hidden', 'true');

//     // Show sign-in button.
//     signInButtonElement.removeAttribute('hidden');
//   }
// }

// // Returns true if user is signed-in. Otherwise false and displays a message.
// function checkSignedInWithMessage() {
//   // Return true if the user is signed in Firebase
//   if (isUserSignedIn()) {
//     return true;
//   }

//   // Display a message to the user using a Toast.
//   var data = {
//     message: 'You must sign-in first',
//     timeout: 2000
//   };
//   signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
//   return false;
// }

// // Resets the given MaterialTextField.
// function resetMaterialTextfield(element) {
//   element.value = '';
//   element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
// }

// // Template for messages.
// var MESSAGE_TEMPLATE =
//   `<li class="media">
//     <img alt="image" class="mr-3 rounded-circle" width="50" src="../assets/img/avatar/avatar-1.png">
//     <div class="media-body">
//       <div class="name mt-0 mb-1 font-weight-bold">Hasan Basri</div>
//       <div class="message text-success text-small font-600-bold"><i class="fas fa-circle"></i> Online</div>
//     </div>
//   </li>`;
// // Adds a size to Google Profile pics URLs.
// function addSizeToGoogleProfilePic(url) {
//   if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
//     return url + '?sz=150';
//   }
//   return url;
// }

// // A loading image URL.
// var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// // Delete a Message from the UI.
// function deleteMessage(id) {
//   var div = document.getElementById(id);
//   // If an element for that message exists we delete it.
//   if (div) {
//     div.parentNode.removeChild(div);
//   }
// }

// function createAndInsertMessage(id, timestamp) {
//   var container = document.createElement('div');
//   container.innerHTML = MESSAGE_TEMPLATE;
//   var div = container.firstChild;
//   div.setAttribute('id', id);

//   // If timestamp is null, assume we've gotten a brand new message.
//   // https://stackoverflow.com/a/47781432/4816918
//   // timestamp = timestamp ? timestamp.toMillis() : Date.now();
//   div.setAttribute('timestamp', timestamp);

//   // figure out where to insert new message
//   var existingMessages = messageListElement.children;
//   if (existingMessages.length === 0) {
//     messageListElement.appendChild(div);
//   } else {
//     let messageListNode = existingMessages[0];

//     // while (messageListNode) {
//     //   const messageListNodeTime = messageListNode.getAttribute('timestamp');

//     //   if (!messageListNodeTime) {
//     //     throw new Error(
//     //       `Child ${messageListNode.id} has no 'timestamp' attribute`
//     //     );
//     //   }

//     //   if (messageListNodeTime > timestamp) {
//     //     break;
//     //   }

//     //   messageListNode = messageListNode.nextSibling;
//     // }

//     messageListElement.insertBefore(div, messageListNode);
//   }

//   return div;
// }

// // Displays a Message in the UI.
// function displayMessage(id, timestamp, name, text, picUrl, imageUrl) {
//   var div = document.getElementById(id) || createAndInsertMessage(id, timestamp);

//   // profile picture
//   if (picUrl) {
//     div.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
//   }

//   div.querySelector('.name').textContent = name;
//   var messageElement = div.querySelector('.name');

//   if (text) { // If the message is text.
//     // messageElement.textContent = text;
//     // Replace all line breaks by <br>.
//     messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
//   }
//   // Show the card fading-in and scroll to view the new message.
//   setTimeout(function () { div.classList.add('visible') }, 1);
//   messageListElement.scrollTop = messageListElement.scrollHeight;
//   messageInputElement.focus();
// }

// // Enables or disables the submit button depending on the values of the input
// // fields.
// function toggleButton() {
//   if (messageInputElement.value) {
//     submitButtonElement.removeAttribute('disabled');
//   } else {
//     submitButtonElement.setAttribute('disabled', 'true');
//   }
// }

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
      'Make sure you go through the codelab setup instructions and make ' +
      'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
// var messageFormElement = document.getElementById('footer');
// var messageInputElement = document.getElementById('footer');
// var submitButtonElement = document.getElementById('footer');
// var imageButtonElement = document.getElementById('footer');
// var imageFormElement = document.getElementById('footer');
// var mediaCaptureElement = document.getElementById('footer');
// var userPicElement = document.getElementById('footer');
// var userNameElement = document.getElementById('footer');
// var signInButtonElement = document.getElementById('footer');
// var signOutButtonElement = document.getElementById('footer');
// var signInSnackbarElement = document.getElementById('footer');

// // Saves message on form submit.
// messageFormElement.addEventListener('submit', onMessageFormSubmit);
// signOutButtonElement.addEventListener('click', signOut);
// signInButtonElement.addEventListener('click', signIn);

// // Toggle for the button.
// messageInputElement.addEventListener('keyup', toggleButton);
// messageInputElement.addEventListener('change', toggleButton);

// // Events for image upload.
// imageButtonElement.addEventListener('click', function (e) {
//   e.preventDefault();
//   mediaCaptureElement.click();
// });
// mediaCaptureElement.addEventListener('change', onMediaFileSelected);

// initialize Firebase
initFirebaseAuth();

// TODO: Enable Firebase Performance Monitoring.
firebase.performance();

// We load currently existing chat messages and listen to new ones.
// loadMessages();