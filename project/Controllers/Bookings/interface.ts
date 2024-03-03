import express from "express";

export interface RequestBody {
    time: string;
    patient: string;
    provider: string;
}

export interface RequestWithQuery extends express.Request {
    query: {
        userId: string;
    }
}

export interface RequestWithParams extends express.Request {
    params: {
        bookingId: string;
    }
}

export interface patientRequestWithParams extends express.Request {
    params: {
        patientId: string;
    }
}
