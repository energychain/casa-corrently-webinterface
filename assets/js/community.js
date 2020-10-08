$(document).ready(function() {
    let animate = true;
    let selector = 'last24h';
    let lastPrice = 9999;
    let lastCost = 9999;
    let infos = [];
    let infos_idx = 0;
    let info_timer = -1;
    let msgurl = "./msg";
    let upd_singleton=0;
   const updateInfo = function() {
   }
   const render = function(data) {
                let msg = JSON.parse(window.localStorage.getItem('msg'));
                let selectors = {};
                for(const [key, peer] of Object.entries(data)) {
                    try {
                      let peer_data = JSON.parse(peer.content);
                      for(const [selector, stats] of Object.entries(peer_data)) {
                          if(typeof selectors[selector] == 'undefined') {
                            if(typeof msg.stats[selector] !== 'undefined') {
                                selectors[selector] = {
                                  energyPrice_kwh: {
                                    min:9999999,
                                    max:0,
                                    avg:0,
                                    cnt:0,
                                    sum:0,
                                    me:msg.stats[selector].energyPrice_kwh
                                  },
                                  incomeSaldo: {
                                    min:9999999,
                                    max:0,
                                    avg:0,
                                    cnt:0,
                                    sum:0,
                                    me:msg.stats[selector].incomeSaldo
                                  }
                                };
                            }
                          }
                          selectors[selector].energyPrice_kwh.cnt++;
                          selectors[selector].energyPrice_kwh.sum += stats.energyPrice_kwh;
                          selectors[selector].incomeSaldo.cnt++;
                          selectors[selector].incomeSaldo.sum += stats.incomeSaldo;
                          if(stats.energyPrice_kwh < selectors[selector].energyPrice_kwh.min) selectors[selector].energyPrice_kwh.min = stats.energyPrice_kwh;
                          if(stats.energyPrice_kwh > selectors[selector].energyPrice_kwh.max) selectors[selector].energyPrice_kwh.max = stats.energyPrice_kwh;
                      }
                    } catch(e) {

                    }
                }
                console.log(selectors);

               document.title = ""+(data.stats[selector].energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})+"/kWh " + (data.stats[selector].incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}) + "/Tag";
               if(typeof data.community == 'undefined') return;

               let ctx = $('#communityChart');

               let elabels = ["24 Stunden","7 Tage","30 Tage","90 Tage","180 Tage","365 Tage"];

               let dataMin=[];
               let dataIch=[];
               let dataMax=[];
               if(typeof data.community.last24h !== 'undefined') {
                   dataMin.push(data.community.last24h.energyPrice_kwh.min);
                   dataIch.push(data.community.last24h.energyPrice_kwh.me);
                   dataMax.push(data.community.last24h.energyPrice_kwh.max);
               }
               if(typeof data.community.last7d !== 'undefined') {
                    dataMin.push(data.community.last7d.energyPrice_kwh.min);
                   dataIch.push(data.community.last7d.energyPrice_kwh.me);
                   dataMax.push(data.community.last7d.energyPrice_kwh.max);
               }
               if(typeof data.community.last30d !== 'undefined') {
                    dataMin.push(data.community.last30d.energyPrice_kwh.min);
                   dataIch.push(data.community.last30d.energyPrice_kwh.me);
                   dataMax.push(data.community.last30d.energyPrice_kwh.max);
               }
              if(typeof data.community.last90d !== 'undefined') {
                    dataMin.push(data.community.last90d.energyPrice_kwh.min);
                   dataIch.push(data.community.last90d.energyPrice_kwh.me);
                   dataMax.push(data.community.last90d.energyPrice_kwh.max);
               }
                if(typeof data.community.last180d !== 'undefined') {
                    dataMin.push(data.community.last180d.energyPrice_kwh.min);
                   dataIch.push(data.community.last180d.energyPrice_kwh.me);
                   dataMax.push(data.community.last180d.energyPrice_kwh.max);
               }
             if(typeof data.community.last365d !== 'undefined') {
                    dataMin.push(data.community.last365d.energyPrice_kwh.min);
                   dataIch.push(data.community.last365d.energyPrice_kwh.me);
                   dataMax.push(data.community.last365d.energyPrice_kwh.max);
               }
               let myChartE = new Chart(ctx, {
                  type: 'radar',
                  data: {
                    datasets: [
                    {
                        label: 'Minimum',
                        data: dataMin,
                        backgroundColor:  'rgba(237,166,69,1)'
                    },
                    {
                        label: 'Ich',
                        data: dataIch,
                        backgroundColor:  'rgba(20,109,59.1)'
                    },
                    {
                        label: 'Maximum',
                        data:dataMax,
                        backgroundColor:  'rgba(192,192,192,1)'
                    }
                    ],
                    labels: elabels
                  },
                  options: {
                    responsive: true,
                    legend: {
                      position: 'top',
                    },
                    plugins: {
                       datalabels: {
                           display:true,
                           color:'#000000',
                           formatter: function(value, context) {
                                return ''+value.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4});
                            }
                       }
                    },
                    title: {
                      display: false,
                      text: ''
                    },
                    animation: {
                      animateScale: animate,
                      animateRotate: animate
                    },
                    tooltips: {
                          enabled: true,
                          mode: 'nearest',
                         callbacks: {
                            label: function(tooltipItems, data) {
                              let l = 'Maximum';
                              if(tooltipItems.datasetIndex == 0) l = 'Minimum';
                              if(tooltipItems.datasetIndex == 1) l = 'Ich';

                              return ''+l + ':' + data.datasets[tooltipItems.datasetIndex].data[tooltipItems.index] + ' €/kWh';
                            }
                          }
                    },
                    elements: {
                      }
                  }
              });

             if(animate) {
                 setTimeout(function() {
                    $('#info').addClass('show');
                 },2000);
             }

             let costs = (data.stats[selector].consumption_wh * data.meterinfo.energyPriceWh) + data.stats[selector].baseCosts;
             let savings = Math.round((1-(((-1)*data.stats[selector].incomeSaldo)/costs))*(10000))/100;
              // Update Table
            let tbody = '';
            tbody += '<tr class="table-success" data-order=0><td>Ich</td>';
            if(typeof data.community.last24h !=='undefined') tbody += '<td data-order="'+data.community.last24h.energyPrice_kwh.me+'">' + data.community.last24h.energyPrice_kwh.me.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last7d !=='undefined') tbody += '<td data-order="'+data.community.last7d.energyPrice_kwh.me+'">' + data.community.last7d.energyPrice_kwh.me.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
             if(typeof data.community.last30d !=='undefined') tbody += '<td data-order="'+data.community.last30d.energyPrice_kwh.me+'">' + data.community.last30d.energyPrice_kwh.me.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
             if(typeof data.community.last365d !=='undefined') tbody += '<td data-order="'+data.community.last365d.energyPrice_kwh.me+'">' + data.community.last365d.energyPrice_kwh.me.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            tbody += '</tr>';

            tbody += '<tr><td data-order=1>Minimum</td>';
            if(typeof data.community.last24h !=='undefined') tbody += '<td data-order="'+data.community.last24h.energyPrice_kwh.min+'">'+ data.community.last24h.energyPrice_kwh.min.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last7d !=='undefined') tbody += '<td data-order="'+data.community.last7d.energyPrice_kwh.min+'">'+ data.community.last7d.energyPrice_kwh.min.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last30d !=='undefined') tbody += '<td data-order="'+data.community.last30d.energyPrice_kwh.min+'">'+ data.community.last30d.energyPrice_kwh.min.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last365d !=='undefined') tbody += '<td data-order="'+data.community.last365d.energyPrice_kwh.min+'">'+ data.community.last365d.energyPrice_kwh.min.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            tbody += '</tr>';

            tbody += '<tr><td data-order=2>Durchschnitt</td>';
             if(typeof data.community.last24h !=='undefined') tbody += '<td data-order="'+data.community.last24h.energyPrice_kwh.avg+'">'+ data.community.last24h.energyPrice_kwh.avg.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last7d !=='undefined') tbody += '<td data-order="'+data.community.last7d.energyPrice_kwh.avg+'">'+ data.community.last7d.energyPrice_kwh.avg.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last30d !=='undefined') tbody += '<td data-order="'+data.community.last30d.energyPrice_kwh.avg+'">'+ data.community.last30d.energyPrice_kwh.avg.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last365d !=='undefined') tbody += '<td data-order="'+data.community.last365d.energyPrice_kwh.avg+'">'+ data.community.last365d.energyPrice_kwh.avg.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            tbody += '</tr>';

            tbody += '<tr><td data-order=3>Maximum</td>';
            if(typeof data.community.last24h !=='undefined') tbody += '<td data-order="'+data.community.last24h.energyPrice_kwh.max+'">'+ data.community.last24h.energyPrice_kwh.max.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last7d !=='undefined') tbody += '<td data-order="'+data.community.last7d.energyPrice_kwh.max+'">'+ data.community.last7d.energyPrice_kwh.max.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last30d !=='undefined') tbody += '<td data-order="'+data.community.last30d.energyPrice_kwh.max+'">'+ data.community.last30d.energyPrice_kwh.max.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            if(typeof data.community.last365d !=='undefined') tbody += '<td data-order="'+data.community.last365d.energyPrice_kwh.max+'">'+ data.community.last365d.energyPrice_kwh.max.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':4}) + "</td>"; else tbody+='<td></td>';
            tbody += '</tr>';
            $('#ctable').html(tbody);
             if(animate) {
            let dttable = $('table').DataTable({
                    searching: false,
                    paging: false,
                    info: false
            } );

             }
             let dttable = $('table').DataTable();
             dttable.order([1, 'asc']).draw();
              window.swiper.removeAllSlides();
             let slides=0;
              if((typeof data.community.last24h !== 'undefined') && (data.community.last24h.energyPrice_kwh.avg > data.community.last24h.energyPrice_kwh.me)) {
                  slides++;
                  let erfolg = Math.abs(Math.round((1-(data.community.last24h.energyPrice_kwh.me / data.community.last24h.energyPrice_kwh.avg))*100));
                 window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-info-circle" style="  margin-right: 10px;"></i>24 Stunden Erfolg </div><div class="blog-slider__text" id="info0">Dein Strompreis war in den letzten 24 Stunden <strong>'+erfolg+'% günstiger</strong> als durchschnittlich in der Community.</div></div></div>');
              }
             if((typeof data.community.last7d !== 'undefined') && (data.community.last7d.energyPrice_kwh.avg > data.community.last7d.energyPrice_kwh.me)) {
                 slides++;
                  let erfolg = Math.abs(Math.round((1-(data.community.last7d.energyPrice_kwh.me / data.community.last7d.energyPrice_kwh.avg))*100));
                 window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-info-circle" style="  margin-right: 10px;"></i>7 Tage Erfolg </div><div class="blog-slider__text" id="info0">Dein Strompreis war in den letzten 7 Tagen <strong>'+erfolg+'% günstiger</strong> als durchschnittlich in der Community.</div></div></div>');
              }
             if((typeof data.community.last30d !== 'undefined') && (data.community.last30d.energyPrice_kwh.avg > data.community.last30d.energyPrice_kwh.me)) {
                 slides++;
                  let erfolg = Math.abs(Math.round((1-(data.community.last30d.energyPrice_kwh.me / data.community.last30d.energyPrice_kwh.avg))*100));
                 window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-info-circle" style="  margin-right: 10px;"></i>30 Tage Erfolg </div><div class="blog-slider__text" id="info0">Dein Strompreis war in den letzten 30 Tagen <strong>'+erfolg+'% günstiger</strong> als durchschnittlich in der Community.</div></div></div>');
              }
             if((typeof data.community.last365d !== 'undefined') && (data.community.last365d.energyPrice_kwh.avg > data.community.last365d.energyPrice_kwh.me)) {
                 slides++;
                  let erfolg = Math.abs(Math.round((1-(data.community.last365d.energyPrice_kwh.me / data.community.last365d.energyPrice_kwh.avg))*100));
                 window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-info-circle" style="  margin-right: 10px;"></i>365 Tage Erfolg </div><div class="blog-slider__text" id="info0">Dein Strompreis war in den letzten 365 Tagen <strong>'+erfolg+'% günstiger</strong> als durchschnittlich in der Community.</div></div></div>');
              }
             if(slides==0) {
                 $('#info').hide();
             }
            animate = false;
   }
   const update = function() {
    $.getJSON("./p2p",function(data) {
      render(msg);
    });
   }

   setInterval(update,120000);
   update();
});
