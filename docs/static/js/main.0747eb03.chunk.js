(this["webpackJsonpreact-sqljs-demo"]=this["webpackJsonpreact-sqljs-demo"]||[]).push([[0],{125:function(e,t,n){},131:function(e,t){},133:function(e,t){},144:function(e,t){},146:function(e,t){},173:function(e,t){},175:function(e,t){},176:function(e,t){},181:function(e,t){},183:function(e,t){},189:function(e,t){},191:function(e,t){},210:function(e,t){},222:function(e,t){},225:function(e,t){},235:function(e,t,n){"use strict";n.r(t);var r=n(6),i=n.n(r),a=n(114),s=n.n(a),o=n(115),l=n(11),c=n(58),u=n.n(c),d=(n(125),n(116)),p=n.n(d),b=n(117),h=n.n(b),x=n.p+"static/media/database.47a3dc22.bin",f=n(118),j=n(59),m=n.n(j),_=n(119),g=n.n(_);n(233);function O(e){var t=document.getElementById(e).offsetTop;(function(e,t,n){if("object"!==typeof e)throw new TypeError("Arguement config expect an Object");var r,i,a=e.start,s=$.extend({},a),o=$.extend({},a),l=e.end,c=e.duration||1e3;function u(e,t,n,r){return[(t-r)/(e-n),(e*r-t*n)/(e-n)]}function d(e,t){return t*o[e][0]+o[e][1]}function p(){var e=Date.now(),r=l;if(e<i){for(var a in r=s,s)s[a]=d(a,e);t(r),requestAnimationFrame(p)}else t(r),n&&n()}return function(){for(var e in r=Date.now(),i=r+c,o)o[e]=u(r,a[e],i,l[e]);p()}})({start:[0,0],end:[document.getElementById(e).offsetLeft,t],duration:1e3},(function(e){window.scrollTo(e[0],e[1])}))()}var v=n(0),y=[{value:"main_checklist",label:"Filters:",showCheckbox:!1,children:[{value:"supported_model_checklist",label:"I need to explain specific AI model(s):",children:[{value:"supported_model_model_agnostic",label:"Any (Model agnostic xAI alg.)",sql:"xai.supported_model_model_agnostic = 1"},{value:"supported_model_tree_based",label:"Tree-based",sql:"xai.supported_model_tree_based = 1"},{value:"supported_model_neural_network",label:"Neural Network",sql:"xai.supported_model_neural_network = 1"}]},{value:"required_output_checklist",label:"I need specific output(s) from the XAI:",children:[{value:"output_importance",label:"Feature importance (Global Explanation)",sql:"xai.output_importance = 1"},{value:"output_attribution",label:"Feature attribution (Local Explanation)",sql:"xai.output_attribution = 1"},{value:"output_interaction",label:"Pair feature interaction (Under development)",sql:"xai.output_interaction = 1"}]},{value:"required_input_data_",label:"Check if we can NOT provide the following information to the xAI algorithm:",children:[{value:"required_input_X_reference",label:"A reference input data",sql:"xai.required_input_X_reference = 0"},{value:"required_input_truth_to_explain",label:"Target values of the data points to explain (i.e. truth, not prediction)",sql:"xai.required_input_truth_to_explain = 0"}]},{value:"explainer_input_xai_",label:"Check if we can NOT execute the following operations on the AI model:",children:[{value:"required_input_predict_func",label:"Perform addional predictions.",sql:"xai.required_input_predict_func = 0"}]},{value:"test_adversarial_attacks",label:"I trust the xAI output (I created the data and the model myself)",sql:"t.category != 'fragility'"}]}],A={};!function e(t,n){t.map((function(e){"sql"in e&&(n[e.value]=e.sql)})),t.map((function(t){"children"in t&&e(t.children,n)}))}(y,A);var S=["fidelity","fragility","stability","simplicity","stress"],w=S.map((function(e){return" ROUND(AVG(case category when '"+e+"' then score end)*100.0,1) AS percentage_"+e})).join(",\n "),I={explainer:"Explainer",time_per_test:"Average time per test",eligible_points:"Number of completed tests",percentage_fidelity:"Fidelity [%]",percentage_fragility:"Fragility [%]",percentage_stability:"Stability [%]",percentage_simplicity:"Simplicity [%]",percentage_stress:"Stress test [%]"};function N(){var e=Object(r.useState)(null),t=Object(l.a)(e,2),n=t[0],i=t[1],a=Object(r.useState)(null),s=Object(l.a)(a,2),c=s[0],d=s[1];return Object(r.useEffect)(Object(o.a)(u.a.mark((function e(){var t,n,r,a,s,o;return u.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,t=p()({locateFile:function(){return f.a}}),n=fetch(x).then((function(e){return e.arrayBuffer()})).catch((function(e){console.log("File not found:"),console.log(e)})),e.next=5,Promise.all([t,n]);case 5:r=e.sent,a=Object(l.a)(r,2),s=a[0],o=a[1],console.log("sql ok."),i(new s.Database(new Uint8Array(o))),e.next=17;break;case 13:e.prev=13,e.t0=e.catch(0),console.log("sql error:"),d(e.t0);case 17:case"end":return e.stop()}}),e,null,[[0,13]])}))),[]),c?Object(v.jsx)("pre",{children:c.toString()}):n?Object(v.jsx)(F,{db:n}):Object(v.jsx)("pre",{children:"Loading..."})}function k(e){for(var t={},n=0;n<e.length;n++)t[e[n]]=n;return t}var T=function(e,t){return e.map((function(e){return e[t]}))},E=function(e,t){return e.map((function(e){return function(e){for(var t=null,n=null,r=0;r<e.length;r++)e[r]&&(t++,n+=e[r]);if(t)var i=Number(n/t);else i=null;return i}(S.map((function(n){return e[t["percentage_"+n]]})))}))};function q(e,t){var n=t.filter((function(e){return e in A})).map((function(e){return A[e]})).join(" AND ");return n.length>0&&(n="Where "+n+" \n"),"\n  --0 For Plotly\n  SELECT\tc.explainer,\nROUND(AVG(c.time),2) AS time_per_test,\ncount(c.score) AS eligible_points,\n"+w+" \nFROM cross_tab AS c\nLeft JOIN test AS t ON c.test = t.test\nLeft JOIN explainer AS xai ON c.explainer = xai.explainer\n"+n+" \nGROUP BY c.explainer;\n\n--1 details about the selected explainer\nSELECT\tdescription AS 'xAI description',\n        supported_models AS 'Supported AI models',\n        outputs AS 'xAI outputs',\n        required_input_data AS 'Required info by the xAI',\n        p.source_paper_bibliography AS 'Original paper',\n        source_code AS 'Source code'\nFROM explainer AS xai\nLeft JOIN paper AS p ON xai.source_paper_tag = p.source_paper_tag\nWhere (explainer = '"+e+"');\n\n--2 detailed scoring of the selected explainer\nSELECT\ttest.short_description AS '  ______Short_description______  ',\nROUND(score,2) AS Score, category AS 'test category',\ntested_xai_output AS 'Tested_xAI_output________'\n--  test.test, subtest no ROUND(time) to make things readable\nFROM cross_tab\nLeft JOIN test ON cross_tab.test = test.test\nWhere (explainer = '"+e+"') and (score IS NOT NULL)\nOrder By Score;\n-- order also by 'test category' test_subtest, 'Tested_xAI_output________';\n\n--3 Kept Unit tests\nSELECT\tcount(DISTINCT c.test_subtest) AS kept_tests\nFROM cross_tab AS c\nLeft JOIN test AS t ON c.test = t.test\nLeft JOIN explainer AS xai ON c.explainer = xai.explainer\n"+n+";\n\n--4 total xAi and tests\nSELECT\tcount(DISTINCT c.test_subtest) AS total_eligible_points,\n    \tcount(DISTINCT c.explainer) AS total_explainers\nFROM cross_tab AS c;\n"}function F(e){var t,n=e.db,i=Object(r.useState)("kernel_shap"),a=Object(l.a)(i,2),s=a[0],o=a[1],c=Object(r.useState)(["output_importance"]),u=Object(l.a)(c,2),d=u[0],p=u[1],b=Object(r.useState)(["main_checklist"]),x=Object(l.a)(b,2),f=x[0],j=x[1],_=Object(r.useState)(n.exec(q(s,d))),A=Object(l.a)(_,2),w=A[0],N=A[1],F=Object(r.useState)(null),C=Object(l.a)(F,2),R=C[0],U=C[1];for(var D=k((t=w[0]).columns),B=E(t.values,D),P=T(t.values,D.time_per_test),J=T(t.values,D.eligible_points),M=T(t.values,D.explainer),G=t.values.length,W=w[3].values[0][0],z=w[4].values[0][0],X=w[4].values[0][1],H=[],K=0;K<P.length;K++)H.push([B[K],P[K]]);var V=h.a.getParetoFrontier(H,{optimize:"bottomRight"}),$=T(V,1),Y=T(V,0),Q=[{x:P,y:B,mode:"markers+text",type:"scatter",name:"Explainers",text:M,textposition:"top center",textfont:{family:"Raleway, sans-serif"},marker:{size:J.map((function(e){return 2*e}))}},{x:$,y:Y,mode:"lines",type:"scatter",name:"Pareto front",textfont:{family:"Times New Roman"},textposition:"bottom center"}],Z=w[1],ee=k(Z.columns),te=t.values.filter((function(e){return e[D.explainer]==s})),ne=te.length>0?S.map((function(e){return te[0][D["percentage_"+e]]})):S.map((function(e){return null})),re=te.length>0?"":"With the applied filters, none of remaining unit tests could be applied on this explainer,\n  please select another one by clicking on a blue dot in the first figure.",ie=[{type:"bar",x:ne.reverse(),y:S.reverse(),text:ne,orientation:"h"}],ae=G<=1?"None of the indexed xAI satisfy the selected constrains. Please use less filters.":"",se="https://arxiv.org/";return Object(v.jsxs)("div",{className:"App",children:[Object(v.jsx)("pre",{className:"error",children:(R||"").toString()}),Object(v.jsx)("h2",{id:"Filters",class:"content-subhead",children:"1. shortlist xAI that fits your needs:"}),Object(v.jsx)("pre",{children:"Use the filters below to describe the xAI model and the dataset you would like to explain."}),Object(v.jsx)("pre",{children:Object(v.jsx)(g.a,{nodes:y,checked:d,expanded:f,onCheck:function(e){!function(e){try{N(n.exec(e)),U(null)}catch(t){U(t),N([])}}(q(s,e)),p(e)},onExpand:function(e){return j(e)},showExpandAll:!0})}),Object(v.jsxs)("pre",{children:["Using the selected filters, we keep ",Object(v.jsxs)("b",{children:[" ",G," xAI tool(s) out of ",X]})," and ",Object(v.jsxs)("b",{children:[W," unit test(s) out of ",z]}),".   "]}),Object(v.jsx)("pre",{className:"error",children:(ae||"").toString()}),Object(v.jsxs)("pre",{children:["Below, we test every xAI on these ",W," unit test(s). Every unit test evaluates a specific aspect of the xAI algorithm (the ",Object(v.jsx)("b",{children:"fidelity"})," of the explanation to the AI behavior, the ",Object(v.jsx)("b",{children:"stability"})," of the xAI against minor changes in the AI, etc.). ",Object(v.jsx)("a",{href:se,children:"Learn more about implemented unit tests and how the selection was done."})]}),Object(v.jsx)("h2",{id:"Overview_Plot",class:"content-subhead",children:"2. Evaluate selected xAI using an intuitive scoring method:"}),Object(v.jsx)(m.a,{data:Q,layout:{width:900,height:580,margin:{t:40,pad:0},xaxis:{type:"log",autorange:!0,title:{text:"Fast alg. <--     Average Time per test [Seconds] \u2193     --\x3e Slow alg."}},yaxis:{range:[1,100],title:{text:"Poor <--  Average Score per test [%] \u2191  --\x3e Excelent"}},legend:{tracegroupgap:20,y:1,yref:"paper",font:{family:"Arial, sans-serif"}},annotations:[{x:.01,y:100,xref:"paper",yref:"y",text:"Best xAI(s) are close to this point",showarrow:!0,arrowhead:7,ax:15,ay:-35,font:{color:"#636363"},arrowcolor:"#636363"}]},onClick:function(e){console.log("plotly_click:"),console.log(e),console.log(e.points);var t=e.points[0].text;o(t);try{O("Explainer_details")}catch(R){console.error(R)}},onHover:function(e){return document.getElementsByClassName("nsewdrag")[0].style.cursor="pointer"},onUnhover:function(e){return document.getElementsByClassName("nsewdrag")[0].style.cursor=""},divId:"fig"}),Object(v.jsxs)("pre",{className:"fig_title",children:[Object(v.jsx)("b",{children:"Figure 1:"}),": Global overview of the explainers' performance.",Object(v.jsx)("br",{}),Object(v.jsx)("b",{children:"Tip"}),": Click on an explainer for more details."]}),Object(v.jsxs)("pre",{children:["The bubble plot (",Object(v.jsx)("b",{children:"Figure 1"}),") summarizes the average performance of the selected xAI(s): time on x-axis v.s. score in percentage on the y-axis. A perfect xAI should obtain a score of 100% and finish all ",W," tests in the smallest amount of time. Therefore, it would be located on the top right.",Object(v.jsx)("br",{}),"Moreover, some xAI might break while running, because of algorithmic/implementation issues. The dot size represents the number of tests completed without failure. Thus, higher portability is described with a bigger dot. ",Object(v.jsx)("a",{href:se,target:"_blank",children:"Learn more about the overview plot."})]}),Object(v.jsxs)("pre",{children:[" An xAI can obtain a good average score but it might completely fail in a specific category of tests. ",Object(v.jsx)("b",{children:"Table 1"})," contains a more detailed scoring method by subdividing the score into ",S.length," categories:",Object(v.jsx)("br",{}),Object(v.jsx)("b",{children:"Fidelity"}),":     Test if the xAI output reflects the underlying model.",Object(v.jsx)("br",{}),Object(v.jsx)("b",{children:"Fragility"}),":    Test if the xAI output is easily manipulable on purpose.",Object(v.jsx)("br",{}),Object(v.jsx)("b",{children:"Stability"}),":    Test if the xAI output is too sensitive to slight changes in the dataset/model.",Object(v.jsx)("br",{}),Object(v.jsx)("b",{children:"Simplicity"}),":   Users should be able to look at the explanation, and reason about model behavior.",Object(v.jsx)("br",{}),Object(v.jsx)("b",{children:"Stress tests"}),": Test if the xAI can explain models trained on big data.",Object(v.jsx)("br",{}),Object(v.jsx)("a",{href:se,target:"_blank",children:"See our paper for more details."})]}),Object(v.jsxs)("pre",{children:[Object(v.jsxs)("pre",{className:"fig_title",children:[Object(v.jsx)("b",{children:"Table 1:"})," Subscores given the selected filters."]}),Object(v.jsx)(L,{columns:w[0].columns.map((function(e){return I[e]})),values:w[0].values})]}),Object(v.jsx)("pre",{children:"Subscores change with the selected list of tests. Unselect all filters to have a global evaluation of the xAI or select the appropriate ones to obtain an evaluation of the use case of your need."}),Object(v.jsx)("pre",{})," ",Object(v.jsxs)("h2",{id:"Explainer_details",class:"content-subhead",children:["3. ",s," Explainer: Details"]}),Object(v.jsx)("pre",{children:"Select one specific Explainer by clicking on a blue dot in Figure 1. Below you can find a helpful description of the explainer and its specific requirements."}),Object(v.jsx)("div",{children:Z.columns.map((function(e,t){return Object(v.jsxs)("pre",{children:[Object(v.jsxs)("b",{children:[e,":"]})," ",Z.values[0][ee[e]]]})}))}),Object(v.jsx)("pre",{className:"error",children:(re||"").toString()}),Object(v.jsx)(m.a,{data:ie,layout:{height:320,font:{family:"Raleway, sans-serif"},showlegend:!1,xaxis:{tickangle:-45,range:[1,100],title:{text:"Score [%] \u2191"}},yaxis:{gridwidth:2,title:{text:"Sub scoring categories"}},bargap:.05},divId:"explainer_fig"}),Object(v.jsxs)("pre",{className:"fig_title",children:[Object(v.jsx)("b",{children:"Figure 2"}),": Score of ",Object(v.jsxs)("b",{children:[s," Explainer"]})," per category."]}),Object(v.jsxs)("h2",{id:"Explainer_limits",class:"content-subhead",children:["4. ",s," Explainer: Limits of the interpretability of its output"]}),Object(v.jsxs)("pre",{children:[Object(v.jsx)("b",{children:"Table 2"})," gives the most detailed scoring. Here you will learn when exactly ",s," fails in explaining a model. The table is sorted by score (increasing) so you just need to look at the few first tests with a score below 80%. Want to learn how to deal with the limitations of the ",s," explainer? ",Object(v.jsx)("a",{href:"https://github.com/Karim-53/Compare-xAI/blob/main/data/01_raw/test.csv",target:"_blank",children:"See the workaround solution for each test here!"})]}),Object(v.jsxs)("pre",{children:[Object(v.jsxs)("pre",{className:"fig_title",children:[Object(v.jsx)("b",{children:"Table 2:"})," Score obtained by ",Object(v.jsxs)("b",{children:[s," explainer"]})," for each test."]}),Object(v.jsx)(L,{columns:w[2].columns,values:w[2].values})]}),Object(v.jsx)("pre",{children:"Table 2 is limited to the selected list of tests after filtering. Unselect all filters to have a global evaluation of the xAI or select the appropriate ones to obtain an evaluation of the use case of your need."})]})}function L(e){var t=e.columns,n=e.values;return Object(v.jsxs)("table",{children:[Object(v.jsx)("thead",{children:Object(v.jsx)("tr",{children:t.map((function(e,t){return Object(v.jsx)("td",{children:e},t)}))})}),Object(v.jsx)("tbody",{children:n.map((function(e,t){return Object(v.jsx)("tr",{children:e.map((function(e,t){return Object(v.jsx)("td",{children:e},t)}))},t)}))})]})}var C=document.getElementById("root");s.a.render(Object(v.jsx)(i.a.StrictMode,{children:Object(v.jsx)(N,{})}),C)}},[[235,1,2]]]);
//# sourceMappingURL=main.0747eb03.chunk.js.map