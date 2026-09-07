FROM node:latest

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates locales tzdata \
    && sed -i '/ja_JP.UTF-8/s/^# //' /etc/locale.gen \
    && locale-gen ja_JP.UTF-8 \
    && npm install --global npm@12 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=ja_JP.UTF-8 \
    LANGUAGE=ja_JP:ja \
    LC_ALL=ja_JP.UTF-8 \
    TZ=Asia/Tokyo

WORKDIR /workspace