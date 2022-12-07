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

//TODO: fix broken modal animationn which fails to execute due to the changeboards function being called

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
        //showmodal();
        changeboards(dateparam)
        $('#past-records-modal').removeClass('show')
        $('body').removeClass("modal-open");
    }
    let datepicker = $(`<div style="display: flex; justify-content: space-between">
   <div>
      <div class="widget-title"> Individual Levels </div>
   </div>
   <div class="right" style="padding-bottom: 4px;">
      <div id="date-container" class="width-150 inline-block" style="">
         <div class="input-group date" data-provide="datepicker" data-date-format="yyyy-mm-dd" data-date-week-start="1" data-date-autoclose="true" data-date-orientation="bottom"><input class="span2 form-control form-input form-select" type="text" value="" name="date" id="date-filter" autocomplete="off" placeholder="2022-05-16"><span class="add-on"></span><label class="input-group-append"><span class="btn btn-default form-select form-input date-btn"><i class="fas fa-calendar-alt"></i></span></label></div>
      </div>
   </div>
</div>`);


    $(".maincontent .widget-header").empty().append(datepicker);
    let go = $("<button class=\"btn btn-primary datego\">Go</button>").css("margin-left", "10px");
    go.click(function() {
        if($("#date-filter").val())
        {
            window.location.href = window.location.href.split('?')[0] + '?date=' + $("#date-filter").val();
        }
    })
    $(".maincontent .widget-header .right").append(go);
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

    var modal = $(`<div class="modal fade" id="past-records-modal">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
					<h5 class="modal-title">[Past records v.1] Please wait...</h5>
				</div><div class="modal-body">Contacting the API... this can take a while for large leaderboards</div>
		</div>
	</div>
</div>`)
    //modal.innerHTML = ''
    modal.css('display', 'block', 'padding-right', '17px')
    document.querySelector(".maincontent").append(modal[0]);
    $('body').addClass("modal-open", function()
                       {
        changeboards(dateparam)

    });
    //document.querySelector('#past-records-modal').classList.add('show')
    //$('body').append(`<div class="modal-backdrop fade show"></div>`)

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
            let response = null;
            while (response != 1)
            {
            $.ajax({

                url: `https://www.speedrun.com/api/v1/leaderboards/${game}/level/${levels[i].id}/${cats[j].id}?top=1&embed=players&date=${date}${default_vars()}`,
                async: false,
                statusCode: {
                    420: function() {
                        delay(5000);
                        response = 0;
                    }},
                success: function(data) {
                    response = 1;
                    //newboard[i][j] = data;
                    let linebuffer = 0;
                    let maxchars = 15;
                    let linenames = 0;
                    let newhtml = "";
                    let cell = $(`#leaderboard-wrapper tr:nth-of-type(${2+i}) td:nth-of-type(${2+j}`); //good,
                    let time = $(cell).find('span').first();
                    let newtime = data.data.runs[0];
                    if(newtime)
                    {
                        newtime = newtime.run.times.primary.split(/[a-zA-Z]+/).slice(0, -1);
                        newhtml = ((newtime.length > 3) ? newtime[-3] + "<small>h</small>" : "") + ((newtime.length > 2) ? newtime.at(-2) : "0") + "<small>m </small>" + padTime(newtime.at(-1),2) + "<small>s</small>"
                    }
                    else{
                        newhtml = "N/A";
                    }
                    $(time).html(newhtml);
                    let l = cell[0].childNodes.length;
                    for(let i=4;i<l-1;i++)
                    {
                        cell[0].removeChild($(cell)[0].childNodes[4]);
                    }
                    for (let i = 0; i < data.data.players.data.length ; i++)
                    {
                        let name = data.data.players.data[i].names.international;
                        if (linenames != 0 && linebuffer + name.length > 15)
                        {
                            cell.append('<br>');
                            linebuffer = 0;
                            linenames = 0;
                        }
                        let newplayer = $(playertemplate).text(name);
                        let country = $(`<img class="flagicon" src="/images/flags/${data.data.players.data[i].location.country.code}.png">`);
                        newplayer.attr("style", `color: ${data.data.players.data[i]['name-style']['color-from'].dark}; --username-gradient-from: ${data.data.players.data[i]['name-style']['color-from'].dark}; --username-gradient-to: ${data.data.players.data[i]['name-style']['color-to'].dark};`);
                        cell.append(country);
                        cell.append(newplayer);
                        cell.append((i == data.data.players.data.length-1) ? '' : ', ');
                        linebuffer += name.length;
                        linenames += 1;

                    }
                }
            }
                  )
            }
        }
    };



}
function padTime(time, length)
{
    let newtime = time
    let zeros = length - time.length
    for (let i = 0; i < zeros; i++)
    {
        newtime = "0" + newtime
    }
    return newtime
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
