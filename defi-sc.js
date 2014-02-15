// Historique des recherches
SearchHistory = new Meteor.Collection("history");

// Client
if (Meteor.isClient)
{
  Template.history.searchList = function() {
    return SearchHistory.find({}, {sort: {date: -1}, limit: 10});
  };
  
  Template.search.events({
    'submit .search-form': function(event)
    {
      // Insertion de la nouvelle recherche dans l'historique
      SearchHistory.insert({
        keywords: $('.search-form input[type="search"]').val(),
        date: new Date,
        user: Meteor.user()._id
      });
      
      // Éviter le rechargement de la page
      event.preventDefault();
    }
  });
}

// Serveur
if (Meteor.isServer)
{
  // Client pour l'API Twitter
  var Twit = Meteor.require('twit');

  Meteor.startup(function ()
  {
    // Insertion d'une valeur d'exemple si l'historique est vide
    if (SearchHistory.find().count() === 0)
      SearchHistory.insert({keywords: "#foobar", date: new Date, user: {}});
  });
}
