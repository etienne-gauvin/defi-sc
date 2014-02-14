
// Historique des recherches
SearchHistory = new Meteor.Collection("search_history");

// Client
if (Meteor.isClient)
{
}

// Serveur
if (Meteor.isServer)
{
  Meteor.startup(function ()
  {
    // Insertion d'une valeur d'exemple
    SearchHistory.insert({keywords: "#foobar", date: new Date});
  });
}
