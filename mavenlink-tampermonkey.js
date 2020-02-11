// ==UserScript==
// @name         Add Total Time to Mavenlink
// @version      1.0
// @description  Tallies the total time of billable and non-billable per day
// @author       Ruby Wood <rwood@thelumery.com>
// @match        https://thelumery.mavenlink.com/timesheets
// @grant        none
// ==/UserScript==

(function(document) {
  const addNewRow = () => {
    const summaryRow = document.querySelector('#table-container tr.summary');
    const newRow = document.createElement('TR');
    newRow.classList = 'totals';
    summaryRow.parentNode.insertBefore(newRow, summaryRow.nextSibling);
    const totalsRow = document.querySelector('.totals');
    const totalsHeading = document.createElement('TD');
    totalsHeading.className = 'total-utilisation label';
    totalsHeading.textContent = 'Total Utilisation';
    totalsRow.prepend(totalsHeading);
    const totalsBlank = document.createElement('TD');
    totalsBlank.classList = 'total-blank';
    totalsRow.prepend(totalsBlank);
  };

  const getNonBillableTime = (day) => {
    const nonBillableTime = day.querySelector('div.non-billable').textContent;

    if (nonBillableTime && nonBillableTime !== '--') {
      const splitTime = nonBillableTime.split('h', 2);
      const nonBillableObject = {
        hours: parseInt(splitTime[0], 10),
        minutes: parseInt(splitTime[1].split('m', 1), 10),
      };
      return nonBillableObject;
    }

    return null;
  };

  const getBillableTime = (day) => {
    const billableTime = day.querySelector('div.billable').textContent;

    if (billableTime && billableTime !== '--') {
      const splitTime = billableTime.split('h', 2);
      const billableObject = {
        hours: parseInt(splitTime[0], 10),
        minutes: parseInt(splitTime[1].split('m', 1), 10),
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

    const totalDate = new Date(0, 0, 0, 0, 0, 0, 0);
    totalDate.setHours(totalDate.getHours() + totalHours);
    totalDate.setMinutes(totalDate.getMinutes() + totalMinutes);

    const totalText = totalDate.getHours() + 'h ' + totalDate.getMinutes() + 'm';

    return totalText;
  };

  const appendTotalDay = (time, element) => {
    const totalDiv = document.createElement('TD');
    totalDiv.className = 'total-time';
    totalDiv.textContent = (time || '--');

    if (element) element.append(totalDiv);
  };

  const updateTotalDay = (time, element) => {
    element.textContent = (time || '--');
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
      days.forEach((element) => {
        const totalRow = document.querySelector('#table-container table.weekly-table tr.totals');
        const totalFigures = totalTime(element);
        appendTotalDay(totalFigures, totalRow);
      });
    }
  };

  const addCss = () => {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.weekly-timesheet-view .weekly-table tr.totals td.total-time{text-align:center;font-size:12px;color:cornflowerblue;height:30px;line-height:30px;}.weekly-timesheet-view .weekly-table tr.totals .total-utilisation.label{color:cornflowerblue !important;text-align: right;border-left:none !important;padding-right:10px;}.weekly-timesheet-view .weekly-table tr.totals td.total-blank{border:none !important;}.weekly-timesheet-view .summary-cell.active-date{border-top: solid 3px #66c34b !important;border-bottom:none !important;}.weekly-timesheet-view .active-date .billable{height:30px !important;}.weekly-timesheet-view .active-date .non-billable{height:31px !important;}.weekly-timesheet-view .weekly-table tr.summary td.summary-cell{border-bottom:none;}.weekly-timesheet-view .weekly-table tr.totals td{border-top-color:#e1e1dd;}';
    document.getElementsByTagName('head')[0].appendChild(style);
  };

  const observerCallback = (mutations, observer) => {
    mutations.forEach(() => {
      updateTotalDays();
    });
  };

  const observeChanges = () => {
    const targetNode = document.querySelector('#table-container tr.summary');
    const reference = targetNode.querySelectorAll('#table-container tr.summary td.week-total.summary-cell [class*="billable"]');
    const config = { attributes: false, childList: true, subtree: true };
    const observer = new MutationObserver(observerCallback);

    reference.forEach(ref => {
      observer.observe(ref, config);
    });
  };

  const rafAsync = () => {
    return new Promise(resolve => {
      requestAnimationFrame(resolve);
    });
  };

  const checkElement = (selector) => {
    if (document.querySelector(selector) === null) {
      return rafAsync().then(() => checkElement(selector));
    } else {
      return Promise.resolve(true);
    }
  };

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
}(document));
