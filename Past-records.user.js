// ==UserScript==
// @name         Past records
// @version      0.2.1
// @description  Displays the Season Leaderboard along with Last 7 days.
// @require http://code.jquery.com/jquery-latest.js
// @author       Hunter C
// @match        *://*.speedrun.com/**/levels**
// @grant        none
// @namespace https://greasyfork.org/users/805959
// ==/UserScript==
var game = window.location.href.split('www.speedrun.com/').pop().split('/levels')[0];
var loaded_gamedata = 0;
var playertemplate = "<span class=\"username username-gradient\"><span class=\"username-dark username-gradient\">Text</span></span>\", \"";
var gameurl = `https://www.speedrun.com/api/v1/games/${game}?embed=levels,categories,variables`
const delay = ms => new Promise(res => setTimeout(res, 5000));
var gamedata
var newboard
var requests = 0;
var dateparam = getUrlParameter("date");
window.onload = function(){
        if (dateparam)
    {
        changeboards(dateparam);
    }

    $(".maincontent .widget-header").empty().append("<div style='display: flex; justify-content: space-between'><div><div class='widget-title'> Individual Levels </div></div><div class='right' style='padding-bottom: 4px;'><div id='date-container' class='width-150 inline-block' style=''><div class='input-group date' data-provide='datepicker' data-date='2022-05-16' data-date-format='yyyy-mm-dd' data-date-week-start='1' data-date-autoclose='true' data-date-orientation='bottom' data-date-end-date='2022-05-16'><input class='span2 form-control form-input form-select' type='text' value='' name='date' id='date-filter' autocomplete='off' placeholder='2022-05-16'><span class='add-on'></span><label class='input-group-append'><span class='btn btn-default form-select form-input date-btn'><i class='fas fa-calendar-alt'></i></span></label></div></div></div></div>");
    let go = $("<button class=\"btn btn-primary datego\">Go</button>").css("margin-left", "10px");
    $(".maincontent .widget-header .right").append(go);
    document.querySelector('.datego').onclick = function() {
        if($("#date-filter").val())
        {
            window.location.href = window.location.href.split('?')[0] + '?date=' + $("#date-filter").val();
        }
    }
};
function default_vars()
{
    let a = {}
    gamedata.data.variables.data.forEach(b => {a[b.id] = b.values.default});
    let b = "";
    for (let i = 0; i < Object.keys(a).length; i++) {
        b += `&var-${Object.keys(a)[i]}=${a[Object.keys(a)[i]]}`
    };
    return b
}
function testfunc(date)
{
    console.log('hi')
};
function showmodal()
{

    //var modal = $()
    //modal.innerHTML = ''
    //document.querySelector(".maincontent").append();
}
function changeboards(date)
{
    if (!gamedata) {
        $.ajax({

            url: gameurl,
            async: false,
            success: function(data) {
                gamedata = data;
            }
        });
    }
    var levels = gamedata.data.levels.data
    var cats = gamedata.data.categories.data.filter(function(x) { return x.type == "per-level"});
    newboard = new Array(levels.length);
    for (let i = 0; i < levels.length; i++) {
        newboard[i] = new Array(cats.length); // make each element an array
    }
    for (let i = 0; i < levels.length; i++)
    {
        for (let j = 0; j < cats.length; j++)
        {
            $.ajax({

                url: `https://www.speedrun.com/api/v1/leaderboards/${game}/level/${levels[i].id}/${cats[j].id}?top=1&embed=players&date=${date}${default_vars()}`,
                async: false,
                statusCode: {
                    420: function() {
                        delay(5000);
                    }},
                success: function(data) {
                    //newboard[i][j] = data;
                    let linebuffer = 0;
                    let cell = $(`#leaderboard-wrapper tr:nth-of-type(${2+i}) td:nth-of-type(${2+j}`); //good,
                    let time = $(cell).find('span').first();
                    let newtime = data.data.runs[0].run.times.primary.split(/[a-zA-Z]+/).slice(0, -1)
                    let newhtml = ((newtime.length > 3) ? newtime[-3] + "<small>h</small>" : "") + ((newtime.length > 2) ? newtime.at(-2) : "0") + "<small>m </small>" + newtime.at(-1) + "<small>s</small>"
                    $(time).html(newhtml);
                    let l = cell[0].childNodes.length;
                    for(let i=4;i<l-1;i++)
                    {
                        cell[0].removeChild($(cell)[0].childNodes[4]);
                    }
                    for (let i = 0; i < data.data.players.data.length ; i++)
                    {
                        let name = data.data.players.data[i].names.international;
                        if (linebuffer + name.length > 15)
                        {
                            cell.append('<br>');
                            linebuffer = 0;
                        }
                        let newplayer = $(playertemplate).text(name);
                        newplayer.attr("style", `color: ${data.data.players.data[i]['name-style']['color-from'].dark}; --username-gradient-from: ${data.data.players.data[i]['name-style']['color-from'].dark}; --username-gradient-to: ${data.data.players.data[i]['name-style']['color-to'].dark};`);
                        cell.append(newplayer);
                        cell.append((i == data.data.players.data.length-1) ? '' : ', ');
                        linebuffer += name.length;

                    }
                }
            }
                  )
        }
    };



}
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
