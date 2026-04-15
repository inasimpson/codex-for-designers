"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CITY_PRESETS = {
  lofoten: {
    name: "Lofoten",
    country: "Norway",
    latitude: 68.234,
    longitude: 14.568,
    image: "/Lofoten.png",
    alt: "Illustrated mountain landscape of Lofoten",
    overlayClassName: "weather-overlay weather-overlay-lofoten",
    statusCopy: {
      loading: "Fetching the latest temperature from Open-Meteo...",
      success: "Live weather for the Lofoten islands.",
      error: "Weather unavailable right now. Check your connection and retry.",
    },
  },
  sydney: {
    name: "Sydney",
    country: "Australia",
    latitude: -33.8688,
    longitude: 151.2093,
    image: "/Sydney.png",
    alt: "Illustrated Sydney Opera House and Harbour Bridge",
    overlayClassName: "weather-overlay weather-overlay-sydney",
    statusCopy: {
      loading: "Fetching the latest temperature from Open-Meteo...",
      success: "Live weather over Sydney Harbour.",
      error: "Weather unavailable right now. Check your connection and retry.",
    },
  },
} as const;

type CityKey = keyof typeof CITY_PRESETS;

type WeatherResponse = {
  current?: {
    temperature_2m: number;
  };
  current_units?: {
    temperature_2m: string;
  };
  timezone?: string;
};

type WeatherStatus = "loading" | "success" | "error";

type WeatherSnapshot = {
  status: WeatherStatus;
  temperature: number | null;
  unit: string;
  timezone: string;
};

const DEFAULT_WEATHER_BY_CITY: Record<CityKey, WeatherSnapshot> = {
  lofoten: {
    status: "loading",
    temperature: null,
    unit: "°",
    timezone: "Europe/Oslo",
  },
  sydney: {
    status: "loading",
    temperature: null,
    unit: "°",
    timezone: "Australia/Sydney",
  },
};

function formatTime(now: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(now);
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<CityKey>("lofoten");
  const [weatherByCity, setWeatherByCity] =
    useState<Record<CityKey, WeatherSnapshot>>(DEFAULT_WEATHER_BY_CITY);
  const [now, setNow] = useState(() => new Date());

  const city = CITY_PRESETS[selectedCity];
  const weather = weatherByCity[selectedCity];

  useEffect(() => {
    const controllers = new Map<CityKey, AbortController>();

    async function loadWeather(cityKey: CityKey) {
      const preset = CITY_PRESETS[cityKey];
      const controller = new AbortController();
      controllers.set(cityKey, controller);

      setWeatherByCity((current) => ({
        ...current,
        [cityKey]: {
          ...current[cityKey],
          status:
            current[cityKey].temperature === null
              ? "loading"
              : current[cityKey].status,
        },
      }));

      try {
        const params = new URLSearchParams({
          latitude: String(preset.latitude),
          longitude: String(preset.longitude),
          current: "temperature_2m",
          timezone: "auto",
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const data = (await response.json()) as WeatherResponse;

        if (!data.current || !data.current_units || !data.timezone) {
          throw new Error("Weather response was incomplete");
        }

        setWeatherByCity((current) => ({
          ...current,
          [cityKey]: {
            status: "success",
            temperature: data.current!.temperature_2m,
            unit: data.current_units!.temperature_2m,
            timezone: data.timezone!,
          },
        }));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(error);

        setWeatherByCity((current) => ({
          ...current,
          [cityKey]: {
            ...current[cityKey],
            status: "error",
          },
        }));
      }
    }

    loadWeather("lofoten");
    loadWeather("sydney");

    return () => {
      controllers.forEach((controller) => controller.abort());
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const temperatureLabel =
    weather.status === "loading"
      ? "--"
      : weather.status === "error" || weather.temperature === null
        ? "??"
        : `${Math.round(weather.temperature)}${weather.unit.replace("C", "")}`;

  const timeLabel = formatTime(now, weather.timezone);
  const statusCopy = city.statusCopy[weather.status];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#a9b0ab_0%,_#7b837e_28%,_#555d59_62%,_#3a423f_100%)] px-5 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <section className="weather-card relative isolate aspect-square w-full max-w-[760px] overflow-hidden rounded-[2rem] px-6 py-6 shadow-[0_32px_90px_rgba(15,18,20,0.28)] sm:px-10 sm:py-10">
          <Image
            src={city.image}
            alt={city.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 760px"
            className="object-cover"
          />
          <div className={city.overlayClassName} />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                  Today
                </p>
                <p className="mt-2 text-[clamp(1.55rem,3vw,2.6rem)] font-semibold leading-none tracking-[-0.04em]">
                  {timeLabel}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[clamp(5rem,16vw,10rem)] font-semibold leading-[0.8] tracking-[-0.08em]">
                  {temperatureLabel}
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between gap-6">
              <div className="max-w-xs">
                <p className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                  {city.name}
                </p>
                <p className="mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                  {city.country}
                </p>
                <p className="mt-5 max-w-[18rem] text-sm font-medium text-white/78 sm:text-base">
                  {statusCopy}
                </p>
              </div>

              <div className="city-toggle relative z-20 shrink-0 rounded-full border border-white/22 bg-black/26 p-1 backdrop-blur-md">
                {(
                  Object.entries(CITY_PRESETS) as Array<
                    [CityKey, (typeof CITY_PRESETS)[CityKey]]
                  >
                ).map(([key, preset]) => {
                  const isActive = key === selectedCity;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCity(key)}
                      className={`city-toggle__button ${isActive ? "city-toggle__button--active" : ""}`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
