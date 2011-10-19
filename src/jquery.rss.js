(function($) {
  var RSS = function(target, url, options) {
    this.target = target
    this.url = url
    this.options = jQuery.extend({
      ssl: false,
      limit: null,
      key: null,
      template: "<ul>{entry}<li><a href='{url}'>[{author}@{date}] {title}</a><br/>{shortBodyPlain}</li>{/entry}</ul>",
      tokens: {}
    }, options || {})
  }

  RSS.prototype.load = function(callback) {
    var apiProtocol = "http" + (this.options.ssl ? "s" : "")
      , apiHost     = apiProtocol + "://ajax.googleapis.com/ajax/services/feed/load"
      , apiUrl      = apiHost + "?v=1.0&output=json_xml&callback=?&q=" + encodeURIComponent(this.url)
      , self        = this

    if (this.options.limit != null) apiUrl += "&num=" + this.options.limit;
    if (this.options.key != null)   apiUrl += "&key=" + this.options.key;

    $.getJSON(apiUrl, callback)
  }

  RSS.prototype.render = function() {
    var self             = this
      , templateMatch    = self.options.template.match(/\{entry\}(.*)\{\/entry\}/)
      , hasEntryTemplate = !!templateMatch
      , entryTemplate    = hasEntryTemplate ? templateMatch[1] : this.options.template
      , html             = []

    this.load(function(data) {
      jQuery(data.responseData.feed.entries).each(function() {
        var entry     = this
          , entryHTML = entryTemplate

        jQuery(entryTemplate.match(/(\{.*?\})/g)).each(function() {
          var token = this.toString()
          entryHTML = entryHTML.replace(token, self.getValueForToken(token, entry))
        })

        html.push(entryHTML)
      })

      html = html.join('\n')
      self.target.append(hasEntryTemplate ? self.options.template.replace(templateMatch[0], html) : jQuery(html))
    })
  }

  RSS.prototype.getValueForToken = function(token, entry) {
    var tokenMap = jQuery.extend({
      url:            entry.link,
      author:         entry.author,
      date:           entry.publishedDate,
      title:          entry.title,
      body:           entry.content,
      shortBody:      entry.contentSnippet,
      bodyPlain:      entry.content.replace(/<\/?[^>]+>/gi, ''),
      shortBodyPlain: entry.contentSnippet.replace(/<\/?[^>]+>/gi, ''),
      teaserImage:    entry.content.match(/(<img.*?>)/gi)[0]
    }, this.options.tokens)

    var result = tokenMap[token.replace(/[\{\}]/g, '')]

    if(result)
      return ((typeof result == 'function') ? result(entry) : result)
    else
      throw new Error('Unknown token: ' + token)
  }

  $.fn.rss = function(url, options) {
    new RSS(this, url, options).render()
  }
})(jQuery)