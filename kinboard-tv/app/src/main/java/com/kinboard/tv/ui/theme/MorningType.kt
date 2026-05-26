package com.kinboard.tv.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.kinboard.tv.R

object MorningFonts {
    val fraunces = FontFamily(Font(R.font.fraunces, FontWeight.Black, FontStyle.Italic))
    val quicksand = FontFamily(Font(R.font.quicksand, FontWeight.Bold))
    val caveat = FontFamily(Font(R.font.caveat, FontWeight.Bold))
}

object MorningType {
    fun fraunces(size: Float, italic: Boolean = true, weight: FontWeight = FontWeight.Black) =
        TextStyle(
            fontFamily = MorningFonts.fraunces,
            fontWeight = weight,
            fontStyle = if (italic) FontStyle.Italic else FontStyle.Normal,
            fontSize = size.sp,
            lineHeight = (size * 0.9).sp,
            letterSpacing = (-0.02 * size / 10).sp
        )

    fun quicksand(size: Float, weight: FontWeight = FontWeight.Bold) =
        TextStyle(
            fontFamily = MorningFonts.quicksand,
            fontWeight = weight,
            fontSize = size.sp
        )

    fun caveat(size: Float, weight: FontWeight = FontWeight.Bold) =
        TextStyle(
            fontFamily = MorningFonts.caveat,
            fontWeight = weight,
            fontSize = size.sp,
            lineHeight = (size * 1.0).sp
        )
}
