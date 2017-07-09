/**
 *
 * (c) 2013-2017 Wishtack
 *
 * $Id: $
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

export class SessionStateSchema {

    token?: string;
    tokenId?: string;
    userId?: string;

    constructor(args: SessionStateSchema = {}) {
        this.token = args.token;
        this.tokenId = args.tokenId;
        this.userId = args.userId;
    }

}

export class SessionState extends SessionStateSchema {

    isSignedIn() {
        return this.token != null;
    }

}

@Injectable()
export class Session {

    private _localStorageKey = 'wtSessionState';
    private _sessionState$: BehaviorSubject<SessionState>;

    constructor() {

        this._sessionState$ = new BehaviorSubject<SessionState>(null);

        this._initializeState();

        window.addEventListener('storage', (event) => {

            /* Not concerned here. */
            if (event.key !== this._localStorageKey) {
                return;
            }

            this._initializeState();

        });

    }

    get state$() {
        return this._sessionState$
            .asObservable()
            .filter((state) => state !== null);
    }

    getToken(): Observable<string> {

        return this.state$
            .first()
            .map((state) => state.token);

    }

    getUserId() {

        return this.state$
            .first()
            .map((state) => state.userId);

    }

    isSignedIn() {

        return this.state$
            .first()
            .map((state) => state.isSignedIn());

    }

    onSignin() {

        return this._onIsSignedInChange()
            .filter((state) => state.isSignedIn());

    }

    onSignout() {

        return this._onIsSignedInChange()
            .filter((state) => !state.isSignedIn());

    }

    updateState(stateData: SessionStateSchema) {

        let state = Object.assign(new SessionState(), this._sessionState$.getValue(), stateData);

        this._sessionState$.next(state);
        this._saveState(state);

    }

    private _initializeState() {
        this._sessionState$.next(this._loadState() || new SessionState());
    }

    private _saveState(state: SessionState) {
        localStorage.setItem(this._localStorageKey, JSON.stringify(state));
    }

    private _loadState(): SessionState {

        let stateString = localStorage.getItem(this._localStorageKey);

        if (stateString == null) {
            return null;
        }

        return new SessionState(JSON.parse(stateString));

    }

    private _onIsSignedInChange(): Observable<SessionState> {

        return this.state$
            .distinctUntilChanged((previous, next) => previous.isSignedIn() === next.isSignedIn())
            /* Skip the current behaviour subject value and wait for a change. */
            .skip(1);

    }

}
