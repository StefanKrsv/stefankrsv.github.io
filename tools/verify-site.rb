# frozen_string_literal: true

require 'nokogiri'
require 'json'
require 'uri'

def check(condition, message)
  abort message unless condition
end

%w[en fr].each do |language|
  prefix = language == 'en' ? '' : '/fr'
  home = Nokogiri::HTML(File.read("_site#{prefix}/index.html"))
  check(home.at_css('html')['lang'] == language, "Wrong document language: #{language}")
  check(home.css('main h1').size == 1, "Expected one homepage h1: #{language}")
  projects = home.css('#post-list article')
  check(!projects.empty?, "Missing projects: #{language}")
  urls = home.css('#post-list a').map { |link| link['href'] }
  check(urls.uniq == urls, "Duplicate projects: #{language}")
  images = home.css('#post-list img')
  check(images.first['fetchpriority'] == 'high' && images.first['loading'] != 'lazy', 'First preview must load eagerly')
  check(images.drop(1).all? { |image| image['loading'] == 'lazy' }, 'Other previews must load lazily')
  check(home.at_css('a.skip-link')['href'] == '#main-content', 'Missing skip link')
  check(!home.at_css('meta[name="viewport"]')['content'].include?('user-scalable=no'), 'Zoom must be enabled')
  check(home.at_css('script[src$="discord.min.js"]')['defer'], 'Discord script must be deferred')
  check(home.at_css('#langSelect option[selected]')['data-lang'] == language, 'Wrong selected language')
  check(home.at_css('#langSelect option[data-lang="en"]')['value'] == '/', 'English switch URL is wrong')
  check(home.at_css('#langSelect option[data-lang="fr"]')['value'] == '/fr/', 'French switch URL is wrong')
  home.css('#post-list a').each do |link|
    check(File.file?("_site#{link['href']}index.html"), "Missing project: #{link['href']}")
    post = Nokogiri::HTML(File.read("_site#{link['href']}index.html"))
    canonical = post.at_css('link[rel="canonical"]')['href']
    check(post.at_css('meta[property="og:url"]')['content'] == canonical, 'Social URL must match article language')
    post.css('.share-icons a').each do |share|
      check(URI.decode_www_form_component(share['href']).include?(canonical), 'Share link must preserve article language')
    end
  end
  search = JSON.parse(File.read("_site#{prefix}/assets/js/data/search.json"))
  check(search.size >= projects.size, "Missing search entries: #{language}")
  check(home.to_html.include?("json: '#{prefix}/assets/js/data/search.json'"), "Wrong search index loaded: #{language}")
  search.each do |entry|
    check(entry['url'].start_with?("#{prefix}/posts/"), "Wrong search result language: #{entry['url']}")
    check(File.file?("_site#{entry['url']}index.html"), "Broken search result: #{entry['url']}")
  end
end

puts 'Bilingual homepage, project routes, search data, image loading, and accessibility checks passed.'
