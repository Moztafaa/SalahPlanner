import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PrayerTimes } from '../models';

/**
 * Service for fetching prayer times from the API
 */
@Injectable({
  providedIn: 'root',
})
export class PrayerTimeService {
  private readonly apiUrl = `${environment.apiUrl}/PrayerTime`;

  constructor(private http: HttpClient) {}

  /**
   * Get prayer times for a specific location and date
   * @param city City name (optional if user has default settings)
   * @param country Country name (optional if user has default settings)
   * @param method Calculation method ID (optional, will use user default or backend default)
   * @param date Date in format yyyy-MM-dd (optional, defaults to today)
   */
  getPrayerTimes(
    city?: string,
    country?: string,
    method?: number,
    date?: string
  ): Observable<PrayerTimes> {
    let params = new HttpParams();

    if (city) params = params.set('city', city);
    if (country) params = params.set('country', country);
    if (method !== undefined) params = params.set('method', method.toString());
    if (date) params = params.set('date', date);

    return this.http
      .get<any>(this.apiUrl, { params })
      .pipe(map((response) => this.transformPrayerTimesResponse(response)));
  }

  /**
   * Get today's prayer times
   * @param city City name
   * @param country Country name
   * @param method Calculation method ID
   */
  getTodayPrayerTimes(city: string, country: string, method: number = 8): Observable<PrayerTimes> {
    let params = new HttpParams()
      .set('city', city)
      .set('country', country)
      .set('method', method.toString());

    return this.http
      .get<any>(`${this.apiUrl}/today`, { params })
      .pipe(map((response) => this.transformPrayerTimesResponse(response)));
  }

  /**
   * Transform backend response to match frontend model
   * Handles camelCase conversion and date parsing
   */
  private transformPrayerTimesResponse(response: any): PrayerTimes {
    return {
      date: response.date ? new Date(response.date) : null,
      fajr: response.fajr || '',
      sunrise: response.sunrise || '',
      dhuhr: response.dhuhr || '',
      asr: response.asr || '',
      maghrib: response.maghrib || '',
      isha: response.isha || '',
    };
  }
}
