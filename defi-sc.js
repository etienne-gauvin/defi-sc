
// Historique des recherches
SearchHistory = new Meteor.Collection("history");

// Client
if (Meteor.isClient)
{
  Template.history.searchList = function() {
    return SearchHistory.find({}, {sort: {date: -1}});
  };
}

// Serveur
if (Meteor.isServer)
{
  Meteor.startup(function ()
  {
    // Insertion d'une valeur d'exemple si l'historique est vide
    if (SearchHistory.find().count() === 0)
      SearchHistory.insert({keywords: "#foobar", date: new Date});
  });
}
