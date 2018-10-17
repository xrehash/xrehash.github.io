/** Copyright Richard Lawson/2018/ xrehash@gmail.com */
//* thing.js

import {
    Book
} from "./core.js";

export class Thing {
    constructor(title, inflate) {
        if (title instanceof Thing || inflate) {
            let thing = title;
            if (!(title instanceof Thing)) {
                this.title = ko.observable(thing.title);
                this.created = ko.observable(thing.created);
                this.description = ko.observable(thing.description);
                this.status = ko.observable(thing.status);
                this.dateDone = ko.observable(thing.dateDone);
                this.dueDate = ko.observable(thing.dueDate);
            } else {
                this.title = (thing.title);
                this.created = (thing.created);
                this.description = (thing.description);
                this.status = (thing.status);
                this.dateDone = (thing.dateDone);
                this.dueDate = (thing.dueDate);
            }
            this.id = thing.id;
        } else {
            this.id = Date.now();
            this.title = ko.observable(title);
            this.created = ko.observable(new Date());
            this.description = ko.observable("");
            this.status = ko.observable(Thing.StatusAllowed.NEW);
            this.dateDone = ko.observable("");
            this.dueDate = ko.observable(new Date(this.created().getFullYear(),
                this.created().getMonth(),
                this.created().getDay() + 1));
        }
        this.marked = ko.observable(false);
    }
    get Title() {
        return this.title;
    }

    get Status() {
        return this.status;
    }
    set Status(status) {
        this.status = status;
    }
    markDone() {
        this.dateDone = new Date();
        this.status(Thing.StatusAllowed.DONE);
    }
    start() {
        if (this.Status() != Thing.StatusAllowed.DONE) {
            this.status(Thing.StatusAllowed.IP);
        }
    }
    pause() {
        switch (this.Status()) {
            case Thing.StatusAllowed.IP:
            case Thing.StatusAllowed.UNDONE:
                this.status(Thing.StatusAllowed.PAUSE);
        }
    }

    playPauseClick(data) {
        switch (this.Status()) {
            case Thing.StatusAllowed.IP:
            case Thing.StatusAllowed.UNDONE:
                this.pause();
                break;
            case Thing.StatusAllowed.PAUSE:
            case Thing.StatusAllowed.NEW:
            case Thing.StatusAllowed.UNDONE:
                this.start();
                break;
        }
    }
    completeItemClick(data) {
        if (this.Status() == Thing.StatusAllowed.DONE) {
            this.Status(Thing.StatusAllowed.UNDONE);
        } else {
            this.markDone();
        }
        // console.log(data);
    }
    moveMarkToggle() {
        this.marked(!this.marked());
    }
    editClick(lst, app, item) {
        //console.log("edit", lst, app, item);
        app.edit(item);
    }
};
Thing.StatusAllowed = {
    NEW: "New",
    IP: "In-Progress",
    PAUSE: 'Paused',
    DONE: "Done",
    UNDONE: 'Un-Done'
};

export class ThingList extends Thing {
    constructor(title, inflate) {
        var lst = [];
        if (title instanceof Thing || inflate) {
            //we clone thing
            let thing = title;
            super(thing, inflate);
            if (thing.items)
                thing.items.forEach(function (x) {
                    if (x.items) {
                        lst.push(new ThingList(x, true));
                    } else {
                        lst.push(new Thing(x, true));
                    }
                });
        } else {
            super(title);
        }
        this.items = ko.observableArray(lst);
    }
    get self() {
        return this;
    }
    add(item) {
        if (item instanceof Thing) {
            this.items.push(item);
        }
    }
    get Items() {
        return this.items();
    }
    promptItem(lst, app) {
        console.log("prompt", this, lst, app);
        var newItem = new Thing("Sleep");
        this.add(newItem);
        app.edit(newItem, app);
    };
    trashItem(data, p) {
        //console.log(data,p);
        data.items.remove(p);
    }
    moveActivate(lst, ankh, item) {
        var bmp = {
            data: item,
            list: lst,
            ankh: ankh
        };
        bmp.data.moveMarkToggle();
        ankh.pocket((bmp.data.marked()) ? bmp : undefined);
        //console.log("Boom", bmp);
    }
    makeListClick(data, next, op) {
        //console.log(self,data,this,next,op)
        if (data instanceof ThingList && next instanceof Thing) {
            data.items.remove(next);
            data.add(new ThingList(next));
        }
    }
    moveComplete(lst, ankh, item) {
        if (ankh && ankh.pocket() && !item.marked() && lst != ankh.pocket().list) {
            //console.log("Pocket", ankh.pocket(), item.Title);
            var a = ankh.pocket();
            item.add(a.data);
            a.list.trashItem(a.list, a.data);
            a.data.moveMarkToggle();
            ankh.pocket(undefined);
        }
    }
}

export const OnMark = function () {
    var contents = ko.observableArray([ /*new ThingList("Yesterday"),new ThingList("Today")*/ ]);
    this.lists = contents;
    var self = this;

    var book = new Book(function (book) {
        //console.log("book call back",book);
        self.book = book;
        self.book.SavedLists(function (lst) {
            //console.log("Peep", lst);
            lst.forEach(function (d) {
                contents.push(new ThingList(d, true));
            });
        });
    });
    this.book = book; //.init();

    self.activeEditItem = ko.observable();
    self.showEditor = ko.observable(false);

    self.Lists = function () {
        return this.lists();
    }
    self.edit = function (item) {
        if (item instanceof Thing) {
            self.activeEditItem({
                tool: item,
                mark: self
            });
            self.showEditor(true);
        }
    };
    self.completeAdd = function (obj) {
        var nlist = obj;
        //console.log("ADDING", obj);
        self.showEditor(false);
        self.activeEditItem(undefined);
    }
    self.addList = function () {
        //this.lists.push(new ThingList("Balloon"));
        var ball = new ThingList("Waffles");
        self.activeEditItem({
            tool: ball,
            mark: self
        });
        self.lists.push(ball);
        self.edit(ball);
        //console.log("ball", self.activeEditItem());
    }
    self.cancelEdit = function () {
        self.showEditor(false);
        self.activeEditItem(undefined);
    }
    self.removeList = function (data, p) {
        //console.log('kill', this, data, p);
        self.book.RemoveAList(p, function () {
            console.log("Blood");
        });
        data.lists.remove(p);
    }
    self.saveList = function (data, p) {
        //console.log("1:", self);
        self.book.SaveAList(p, function () {
            console.log(p.Title() + " saved.")
        });
    }
    self.pocket = ko.observable();

}