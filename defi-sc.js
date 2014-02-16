// Config
var twitterConfig = {
  consumerKey: "ba6u3ERIWK9Hf8UWaDTwAA",
  consumerSecret: "1Gf1fmC025YXyc9iXOPTztiGpTf5ti3ADZCgxqE"
}

// Historique des recherches
SearchHistory = new Meteor.Collection("history");

// Résultats
Results = new Meteor.Collection("results");

// Client
if (Meteor.isClient)
{
  // On efface les données enregistrées si le serveur est redémarré
  Session.set('keywords', null);
  
  
  // Retourne la liste des dernières recherches
  Template.history.searchList = function() {
    return SearchHistory.find({}, {sort: {date: -1}, limit: 50});
  };
  
  // Retourne les mots-clés
  Template.results.currentKeywords = function() {
    return Session.get('keywords');
  };
  
  // Retourne les derniers résultats de la recherche
  Template.results.resultList = function() {
    if (Session.get('keywords'))
      return Results.find({
        keywords: Session.get('keywords')},
        {sort: {date: -1}, limit: 100});
    
    else
      return false;
  };
  
  Template.search.events({
  
    // Submit du formulaire de recherche
    'submit .search-form': function(event)
    {
      var keywords = $('.search-form input[type="search"]').val();
      Session.set('keywords', keywords);
      
      // Insertion de la nouvelle recherche dans l'historique
      SearchHistory.insert({
        keywords: keywords,
        date: new Date,
        user: Meteor.user()._id
      });
      
      // Appel de la fonction de recherche
      Meteor.call('search', {keywords: keywords});
      
      // Éviter le rechargement de la page
      event.preventDefault();
    }
  });
  
  Template.history.events({
  
    // Relancer une recherche de l'historique
    'click .search': function(event, a, b, c)
    {
      if (Meteor.user())
      {
        // Id de la recherche dans l'historique
        var searchId = $(event.target).data("id");
        
        // Lorsque le clic est fait sur un enfant de .search
        if (!searchId)
          searchId = $(event.target).parent().data("id");
        
        // Récupération des infos de la recherche
        var search = SearchHistory.findOne({_id: searchId});
        
        // Mise à jour de la date
        SearchHistory.update(searchId, {$set: {date: new Date}});
        
        // Enrgistrement des nouveaux mots-clés
        Session.set('keywords', search.keywords);
        
        // Appel de la fonction de recherche
        Meteor.call('search', {keywords: search.keywords});
      }
    }
  });
}

// Serveur
if (Meteor.isServer)
{
  // Liste des streams
  var streams = [];
  
  // Client pour l'API Twitter
  var Twit = Meteor.require('twit');
  
  // Méthodes utilisables par le client
  Meteor.methods({
    
    // Fonctione de recherche
    search: function(params)
    {
      // Configuration
      var userTwitterConfig = Meteor.users.findOne({_id: this.userId}).services.twitter;
      var T = new Twit({
        consumer_key:         twitterConfig.consumerKey,
        consumer_secret:      twitterConfig.consumerSecret,
        access_token:         userTwitterConfig.accessToken,
        access_token_secret:  userTwitterConfig.accessTokenSecret
      });
      
      // Suppression des anciens résultats
      Results.remove({keywords: params.keywords});
      
      // Fonction d'ajout de résultat dans la base de données
      var addResult = Meteor.bindEnvironment(
        function(tweet) {
          Results.insert({
            keywords: params.keywords,
            date: new Date(tweet.created_at),
            tweet: tweet
          });
        },
        function(e){
          console.log('Bind error !');
        }
      )
      
      // Récupération des 10 tweets les plus récents pour remplir la liste
      T.get('search/tweets', {q: params.keywords, count: 10}, function(err, reply) {
        //console.log(typeof reply)
        if (!err)
        {
          for (var i = 0; i < reply.statuses.length ; i++)
            addResult(reply.statuses[i]);
        } 
      });
      
      // Si l'utilisateur avait déjà un stream en cours, on l'arrête
      //if (streams[this.userId])
        //streams[this.userId].stop();
      
      // Stream
      var stream = T.stream('statuses/filter', {track: params.keywords});
      streams[this.userId] = stream;
      
      // Pour chaque nouveau tweet, ajout de celui-ci dans la base de données
      stream.on('tweet', addResult);
    }
  });
}

