/*
 * Plugins that do transformations on links in tweets
 * e.g. short URL expanding, image preview
 */

require.def("stream/linkplugins",
  ["stream/helpers", "/ext/parseUri.js"],
  function(helpers) {
    
    var UntinyDomains = ["bit.ly"];
    
//    $.get("/untiny/1.0/services/?format=json&bla=35", function(data, textStatus) {
//      if(textStatus == "success" && data) {
//        UntinyDomains.push.apply(UntinyDomains, Object.keys(data));
//      }
//    }, 'json');
    
    var index = 0;
    
    return {
      
      id: {
        func: function untiny(a, tweet, stream, plugin) {
          a.attr('id', 'href' + index++);
        }
      },
      
      untiny: {
        domains: UntinyDomains, // extended via API call,
        func: function untiny(a, tweet, stream, plugin) {
          return; // disable for JSConf
          var prefixLength = "http://".length;
          var href = a.attr("href") || "";
          var id = a.attr('id');
          var domains = plugin.domains;
          for(var i = 0, len = domains.length; i < len; ++i) {
            var domain = domains[i];
            if(href.indexOf(domain) === prefixLength) {
              var url = "/untiny/1.0/extract/?url="+encodeURIComponent(href)+"&format=json";
              $.get(url, function(data, textStatus) {
                if(textStatus == "success") {
                  if(data && data.org_url) {
                    var a = $('#'+id);
                    a.attr('data-tiny-href', href);
                    a.attr('href', data.org_url);
                  } else {
                    console.log('Untiny error ', data)
                  }
                }
              }, 'json');
              break;
            }
          }
        }
      },
      
      imagePreview: {
        transformations: {
          standard: function (url) {
            return "http://"+url.host+"/show/thumb"+url.path;
          },
          yfrog: function (url) {
            return "http://"+url.host+url.path+".th.jpg";
          },
          "i.imgur.com": function (url) {
            var path = (url.path || "").replace(/(?:.jpg)?$/, "s.jpg");
            return "http://"+url.host+path;
          },
          "imgur.com": function (url) {
            return this["i.imgur.com"](url);
          }
        },
        domains: ["img.ly", "twitpic.com", "yfrog", "imgur.com", "i.imgur.com"],
        func: function imagePreview (a, tweet, stream, plugin) { // a is a jQuery object of the a-tag
          var prefixLength = "http://".length;
          var href = a.attr("href") || "";
          var domains = plugin.domains;
          for(var i = 0, len = domains.length; i < len; ++i) {
            var domain = domains[i];
            if(href.indexOf(domain) === prefixLength) {
              var url = parseUri(href);
              var trans = plugin.transformations[domain] || plugin.transformations.standard;
              var previewURL = trans.call(plugin.transformations, url);
              var image = new Image();
              image.src = previewURL;
              var div = $('<span class="image-preview"/>');
              div.append(image)
              /*image.width = 150;
              image.height = 150;*/
              a.addClass("image").append(div);
            }
          }
        }
      },
    }
      
  }
);