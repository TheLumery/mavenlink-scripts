// ==UserScript==
// @name         Add Total Time to Mavenlink
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Ruby Wood <rwood@thelumery.com>
// @match        https://thelumery.mavenlink.com/timesheets
// @grant        none
// ==/UserScript==

(function(document, window) {

  const addNewRow = () => {
    const summaryRow = document.querySelector('#table-container tr.summary');
    let newRow = document.createElement('TR');
    newRow.classList = "totals";
    summaryRow.parentNode.insertBefore(newRow, summaryRow.nextSibling);
    const totalsRow = document.querySelector('.totals');
    let totalsHeading = document.createElement('TD');
    totalsHeading.className = "total-utilisation label";
    totalsHeading.textContent = "Total Utilisation";
    totalsRow.prepend(totalsHeading);
    const totalsBlank = document.createElement('TD');
    totalsBlank.classList = "total-blank"
    totalsRow.prepend(totalsBlank);
  };

  const getNonBillableTime = (day) => {
    const nonBillableTime = day.querySelector('div.non-billable').textContent;

    if (nonBillableTime && nonBillableTime != "--") {
      const splitTime = nonBillableTime.split('h',2);
      const nonBillableObject = {
        'hours' : parseInt(splitTime[0]),
        'minutes' : parseInt(splitTime[1].split('m',1))
      };
      return nonBillableObject;
    }

    return null;
  };

  const getBillableTime = (day) => {
    const billableTime = day.querySelector('div.billable').textContent;

    if (billableTime && billableTime != "--") {
      const splitTime = billableTime.split('h',2);
      const billableObject = {
        'hours' : parseInt(splitTime[0]),
        'minutes' : parseInt(splitTime[1].split('m',1))
      };
      return billableObject;
    }

    return null;
  };

  const totalTime = (day) => {
    const billableTime = getBillableTime(day);
    const nonBillableTime = getNonBillableTime(day);

    if (!billableTime && !nonBillableTime) {
      return null;
    }

    const totalHours = (billableTime !== null ? billableTime.hours : 0) + (nonBillableTime !== null ? nonBillableTime.hours : 0);
    const totalMinutes = (billableTime !== null ? billableTime.minutes : 0) + (nonBillableTime !== null ? nonBillableTime.minutes : 0);

    if (totalHours <= 0 && totalMinutes <= 0) {
      return null;
    }

    let totalDate = new Date(0, 0, 0, 0, 0, 0, 0);
    totalDate.setHours(totalDate.getHours() + totalHours);
    totalDate.setMinutes(totalDate.getMinutes() + totalMinutes);

    const totalText = totalDate.getHours() + "h " + totalDate.getMinutes() + "m";

    return totalText;
  };

  const appendTotalDay = (time, element) => {
    let totalDiv = document.createElement('TD');
    totalDiv.className = "total-time";
    totalDiv.textContent = time ? time : "--";

    if (element) element.append(totalDiv);
  };

  const updateTotalDay = (time, element) => {
    element.textContent = time ? time : "--";
  };

  const getDays = () => {
    const days = document.querySelectorAll('#table-container tr.summary td.summary-cell');
    return days;
  };

  const getDaysTotals = () => {
    const daysTotals = document.querySelectorAll('#table-container table.weekly-table tr.totals td.total-time');
    return daysTotals;
  };

  const updateTotalDays = () => {
    const days = getDays();
    const daysTotals = getDaysTotals();

    if (daysTotals.length > 0) {
      days.forEach((element, i) => {
        const totalFigures = totalTime(element);
        updateTotalDay(totalFigures, daysTotals[i]);
      });
    } else {
      days.forEach((element, i) => {
        const totalRow = document.querySelector('#table-container table.weekly-table tr.totals');
        const totalFigures = totalTime(element);
        appendTotalDay(totalFigures, totalRow);
      });
    }
  };

  const addCss = () => {
    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.total-time{text-align:center;font-size:12px;border-top:1px solid #e1e1dd;color:cornflowerblue;height:30px;line-height:30px;}.total-utilisation.label{border-top:1px solid #e1e1dd;height:31px;line-height:33px;color:cornflowerblue !important;text-align: right;border-color:#e1e1dd;border-left:none !important;padding-right:10px;}.total-blank{border:none !important;}.totals td{height:30px;line-height:30px;}.weekly-timesheet-view .summary-cell.active-date{border-top: solid 3px #66c34b !important;border-bottom:none !important;}';
    document.getElementsByTagName('head')[0].appendChild(style);
  };

  const observerCallback = (mutations, observer) => {
    mutations.forEach((mutation) => {
      updateTotalDays();
    });
  };

  const observeChanges = () => {
    const targetNode = document.querySelector('#table-container tr.summary');
    const reference = targetNode.querySelectorAll('#table-container tr.summary td.week-total.summary-cell [class*="billable"]');
    const config = {attributes: false, childList: true, subtree: true};
    const observer = new MutationObserver(observerCallback);

    reference.forEach(ref => {
      observer.observe(ref, config);
    });
  };

  const rafAsync = () => {
    return new Promise(resolve => {
      requestAnimationFrame(resolve);
    });
  }

  const checkElement = (selector) => {
    if (document.querySelector(selector) === null) {
      return rafAsync().then(() => checkElement(selector));
    } else {
      return Promise.resolve(true);
    }
  }

  const init = () => {
    checkElement('#table-container tr.summary')
    .then(() => {
        addCss();
        addNewRow();
        updateTotalDays();
        observeChanges();
    });
  };

  init();

})(document, window);