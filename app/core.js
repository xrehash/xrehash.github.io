/** Copyright Richard Lawson/2018/ xrehash@gmail.com */
//* core.js
import * as om from "./thing.js";
//import * as ko from "/lib/knockout-3.4.2.js";

export class Network {
    constructor() {
        this.self = this;
        self.APIServer = "";
    }

    fetch(path) {
        var path = path || "";
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", (self.APIServer + path), true);
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            }
            xhr.send();
        });

    }
};
export class Book {
    constructor(rdy) {
        this.self = this;
        this.osn = "ListTbl";
        this.dbn = "onMarkDB";
        var onready = rdy;
        var request = indexedDB.open(this.dbn, 1);
        request.onupgradeneeded = function (e) {
            console.log('In Upgrade');
            var db = e.target.result;
            let store = db.createObjectStore("ListTbl", {
                keyPath: "id"
            });
            store.createIndex("by_title", "title");
            store.put(ko.toJS(new om.ThingList("Tomorrow")));
        }
        request.onerror = function (evt) {
            console.log(evt);
        }
        var ank = this;
        request.onsuccess = function (e) {
            ank.db = e.target.result;
            console.log(ank);
            if (onready) {
                onready(ank);
            } else {
                console.log("no onready")
            }
        }
    }

    SavedLists(anx) {
        console.log(this.db, "---", this.self);

        if (this.db) {
            console.log("in it");
            var tx = this.db.transaction(['ListTbl'], 'readwrite');
            var tbl = tx.objectStore('ListTbl');
            var cur = tbl.openCursor(IDBKeyRange.lowerBound(0));
            var lists = [];
            tx.oncomplete = function (e) {
                anx(lists);
            }
            cur.onsuccess = function (e) {
                var result = e.target.result;
                if (!!result == false) {
                    console.log('Empty');
                    return;
                }
                lists.push(result.value);
                result.continue();
            }
        }
    }
    SaveAList(lst, then) {
        if (this.db && lst) {
            console.log("saving");
            var tx = this.db.transaction(['ListTbl'], 'readwrite');
            var tbl = tx.objectStore('ListTbl');
            tbl.put(ko.toJS(lst));
            tx.oncomplete = function () {
                if (then)
                    then();
            }
        }
    }
    RemoveAList(lst, then) {
        if (this.db && then) {
            console.log("erasing");
            var tx = this.db.transaction(['ListTbl'], 'readwrite');
            var tbl = tx.objectStore('ListTbl');
            tbl.delete(ko.toJS(lst).id);
            tx.oncomplete = function () {
                if (then) {
                    then();
                }
            }
        }
    }
}